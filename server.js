const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// 🗄️ SQLite 資料庫連線與自動建表
// ==========================================
const db = new sqlite3.Database('./profit.db', (err) => {
    if (err) console.error('❌ SQLite 資料庫連線失敗：', err.message);
    else console.log('🎉 成功建立並連線到 SQLite 本機資料庫 (profit.db)！');
});

// 啟動外鍵支持與建立所有資料表
db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON;');

    db.run(`CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Exercises (
        exercise_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        default_video_url TEXT,
        description TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Workout_Logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        log_date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES Exercises(exercise_id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Templates (
        template_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Template_Exercises (
        template_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        PRIMARY KEY (template_id, exercise_id),
        FOREIGN KEY (template_id) REFERENCES Templates(template_id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES Exercises(exercise_id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_saved_videos (
        video_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        video_url TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES Exercises(exercise_id) ON DELETE CASCADE
    )`);
});

// ==========================================
// 🔐 使用者帳號 API 區塊
// ==========================================
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '帳號與密碼為必填！' });

    db.run('INSERT INTO Users (username, password) VALUES (?, ?)', [username, password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: '這個帳號已經被註冊過囉！' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: '註冊成功！', userId: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.all('SELECT user_id, username, password FROM Users WHERE username = ?', [username], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        if (users.length === 0) return res.status(401).json({ error: '此帳號未註冊，請先點擊下方建立帳號！' });
        
        const user = users[0];
        if (user.password !== password) return res.status(401).json({ error: '密碼錯誤，請再試一次！' });
        
        res.json({ message: '登入成功！', user: { user_id: user.user_id, username: user.username } });
    });
});

// ==========================================
// 🏋️ 健身動作 API 區塊
// ==========================================
app.get('/api/exercises', (req, res) => {
    db.all('SELECT * FROM Exercises', [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/exercises', (req, res) => {
    const { name, muscle_group, default_video_url, description } = req.body;
    db.run('INSERT INTO Exercises (name, muscle_group, default_video_url, description) VALUES (?, ?, ?, ?)', 
        [name, muscle_group, default_video_url, description], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '動作新增成功！', id: this.lastID });
    });
});

app.put('/api/exercises/detail/:id', (req, res) => {
    const { name, muscle_group, default_video_url } = req.body;
    db.run('UPDATE Exercises SET name = ?, muscle_group = ?, default_video_url = ? WHERE exercise_id = ?', 
        [name, muscle_group, default_video_url, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '動作資料更新成功！' });
    });
});

app.put('/api/exercises/:id', (req, res) => {
    db.run('UPDATE Exercises SET description = ? WHERE exercise_id = ?', [req.body.description, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '動作要領更新成功！' });
    });
});

app.delete('/api/exercises/:id', (req, res) => {
    db.run('DELETE FROM Exercises WHERE exercise_id = ?', [req.params.id], function(err) {
        if (err) {
            if (err.message.includes('FOREIGN KEY constraint failed')) {
                return res.status(400).json({ error: '這個動作已經有訓練紀錄或被加入模板中，無法刪除！' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: '動作已成功刪除！' });
    });
});

// ==========================================
// 📋 訓練模板 API 區塊
// ==========================================
app.post('/api/templates', (req, res) => {
    const { name, exerciseIds, userId } = req.body;
    if (!userId) return res.status(400).json({ error: '缺少使用者 ID' });

    db.run('INSERT INTO Templates (user_id, name) VALUES (?, ?)', [userId, name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const newTemplateId = this.lastID;

        if (!exerciseIds || exerciseIds.length === 0) return res.json({ message: '模板建立成功！' });

        const placeholders = exerciseIds.map(() => '(?, ?)').join(', ');
        const values = exerciseIds.flatMap(exId => [newTemplateId, exId]);
        
        db.run(`INSERT INTO Template_Exercises (template_id, exercise_id) VALUES ${placeholders}`, values, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: '專屬模板建立成功！', templateId: newTemplateId });
        });
    });
});

app.get('/api/templates', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: '缺少使用者 ID' });

    const sql = `
        SELECT t.template_id, t.name AS template_name, e.exercise_id, e.name AS exercise_name, e.muscle_group
        FROM Templates t
        LEFT JOIN Template_Exercises te ON t.template_id = te.template_id
        LEFT JOIN Exercises e ON te.exercise_id = e.exercise_id
        WHERE t.user_id = ? ORDER BY t.template_id DESC
    `;
    db.all(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const templatesMap = {};
        results.forEach(row => {
            if (!templatesMap[row.template_id]) templatesMap[row.template_id] = { id: row.template_id, name: row.template_name, exercises: [] };
            if (row.exercise_id) templatesMap[row.template_id].exercises.push({ id: row.exercise_id, name: row.exercise_name, muscle: row.muscle_group });
        });
        res.json(Object.values(templatesMap));
    });
});

// ==========================================
// 📅 訓練紀錄 API 區塊
// ==========================================
app.post('/api/logs', (req, res) => {
    const { exerciseId, weight, reps, logDate, userId } = req.body;
    db.run('INSERT INTO Workout_Logs (user_id, exercise_id, weight, reps, log_date) VALUES (?, ?, ?, ?, ?)', 
        [userId, exerciseId, weight, reps, logDate], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '紀錄新增成功！', logId: this.lastID });
    });
});

app.get('/api/logs', (req, res) => {
    const userId = req.query.userId;
    const sql = `
        SELECT wl.log_id, wl.exercise_id, wl.weight, wl.reps, wl.log_date, e.name AS exercise_name
        FROM Workout_Logs wl JOIN Exercises e ON wl.exercise_id = e.exercise_id
        WHERE wl.user_id = ? ORDER BY wl.log_date DESC, wl.log_id DESC
    `;
    db.all(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.delete('/api/logs/:id', (req, res) => {
    db.run('DELETE FROM Workout_Logs WHERE log_id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '訓練紀錄已成功刪除！' });
    });
});

app.get('/api/logs/latest/:exerciseId', (req, res) => {
    const { exerciseId } = req.params;
    const { userId } = req.query;
    db.all('SELECT weight, reps, log_date FROM Workout_Logs WHERE exercise_id = ? AND user_id = ? ORDER BY log_date DESC, log_id DESC LIMIT 1', 
        [exerciseId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results.length > 0 ? results[0] : null);
    });
});

app.get('/api/prs', (req, res) => {
    const userId = req.query.userId;
    const sql = `
        SELECT e.name AS exercise_name, MAX(wl.weight) AS pr_weight
        FROM Workout_Logs wl JOIN Exercises e ON wl.exercise_id = e.exercise_id
        WHERE wl.user_id = ? GROUP BY wl.exercise_id, e.name ORDER BY pr_weight DESC
    `;
    db.all(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==========================================
// 📹 自訂教學影片 API 區塊 (user_saved_videos)
// ==========================================
app.get('/api/exercises/videos/:exerciseId', (req, res) => {
    const { exerciseId } = req.params;
    const { userId } = req.query;
    db.all('SELECT video_id, title, video_url FROM user_saved_videos WHERE user_id = ? AND exercise_id = ? ORDER BY video_id DESC', 
        [userId, exerciseId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/exercises/videos', (req, res) => {
    const { userId, exerciseId, title, videoUrl } = req.body;
    db.run('INSERT INTO user_saved_videos (user_id, exercise_id, title, video_url) VALUES (?, ?, ?, ?)', 
        [userId, exerciseId, title, videoUrl], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '成功新增專屬教學影片！', videoId: this.lastID });
    });
});

app.delete('/api/exercises/videos/:videoId', (req, res) => {
    db.run('DELETE FROM user_saved_videos WHERE video_id = ?', [req.params.videoId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '影片已成功刪除！' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 系統已成功啟動於 Port ${PORT} (使用 SQLite 引擎)`);
});