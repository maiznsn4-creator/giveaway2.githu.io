const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { JSONFile } = require('lowdb/node');
const { Low } = require('lowdb');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// រៀបចំ Database (រក្សាទុកក្នុង file db.json)
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { users: [] });

// មុខងារទាញយកទិន្នន័យ User
async function getUser(userId) {
    await db.read();
    return db.data.users.find(u => u.id === userId);
}

// ១. API សម្រាប់ឆែកសមតុល្យលុយ ឬចុះឈ្មោះចូល
app.post('/api/user', async (req, res) => {
    const { id, name } = req.body;
    await db.read();
    
    let user = db.data.users.find(u => u.id === id);
    if (!user) {
        user = { id, name, balance: 0, referrals: 0, hasVerified: false };
        db.data.users.push(user);
        await db.write();
    }
    res.json(user);
});

// ២. API សម្រាប់ផ្ទៀងផ្ទាត់ (Verify) និងបូកលុយឱ្យអ្នកណែនាំ
app.post('/api/verify', async (req, res) => {
    const { userId, inviterId } = req.body;
    await db.read();

    const user = db.data.users.find(u => u.id === userId);
    
    // បើ User មិនទាន់ធ្លាប់ Verify ពីមុនមក
    if (user && !user.hasVerified) {
        user.hasVerified = true;

        // បូកលុយឱ្យអ្នកណែនាំ (Inviter)
        if (inviterId && inviterId !== userId) {
            const inviter = db.data.users.find(u => u.id === inviterId);
            if (inviter) {
                inviter.balance += 0.05;
                inviter.referrals += 1;
            }
        }
        await db.write();
        res.json({ success: true, balance: user.balance });
    } else {
        res.json({ success: false, message: "ធ្លាប់បានផ្ទៀងផ្ទាត់រួចហើយ" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

