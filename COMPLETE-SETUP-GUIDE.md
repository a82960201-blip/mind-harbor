# 🚀 MIND HARBOR - COMPLETE SETUP GUIDE

## 📱 **NEW IN THIS VERSION:**
✅ **Favicon added** - 💙 icon shows in browser tabs
✅ **Fully mobile responsive** - Works perfectly on phones
✅ **Touch-optimized** - Buttons sized for fingers
✅ **iOS keyboard fix** - No auto-zoom on inputs
✅ **Ready for Paystack donation button**

---

## 🎯 **QUICK START (5 Steps):**

### **1. Extract ZIP**
- Extract to: `C:\mind-harbor`
- Or anywhere you want

### **2. Fix PowerShell (If on Windows)**
Open PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Press `Y` when asked

### **3. Install Dependencies**
Open VS Code, open the folder, then Terminal:
```bash
npm install
```
Wait 30 seconds

### **4. Start Server**
```bash
npm start
```

### **5. Open Browser**
```
http://localhost:3000
```

**Done! Mind Harbor is running!** 💙

---

## ☕ **ADDING DONATION BUTTON (After Paystack Setup):**

### **Once you have your Paystack link:**

1. Open `index.html`
2. Find line 87 (before `</div>` closing tag)
3. Add this code:

```html
        <div class="donation-section">
            <a href="YOUR_PAYSTACK_LINK_HERE" target="_blank" class="donate-btn">
                <span class="donate-icon">☕</span>
                Support Mind Harbor
            </a>
            <p class="donate-text">Help keep this free for everyone</p>
        </div>
```

4. Replace `YOUR_PAYSTACK_LINK_HERE` with your actual Paystack link

5. Add CSS to `css/style.css`:

```css
.donation-section {
    text-align: center;
    margin: 40px 0;
    padding: 30px;
    background: rgba(79, 195, 247, 0.05);
    border: 1px solid rgba(79, 195, 247, 0.2);
    border-radius: 15px;
}

.donate-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 15px 35px;
    background: linear-gradient(135deg, #4ade80, #22c55e);
    color: white;
    text-decoration: none;
    border-radius: 10px;
    font-size: 1.1em;
    font-weight: 600;
    transition: all 0.3s ease;
}

.donate-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(74, 222, 128, 0.5);
}

.donate-icon {
    font-size: 1.3em;
}

.donate-text {
    color: #a0c4ff;
    font-size: 0.9em;
    margin-top: 10px;
}
```

6. Save and restart server (`npm start`)

---

## 📱 **MOBILE TESTING:**

### **Test on Your Phone:**

1. **Find your computer's IP:**
   - Windows: Open CMD, type `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.5)

2. **On your phone browser, go to:**
   ```
   http://YOUR_IP:3000
   ```
   (Replace YOUR_IP with actual IP)

3. **Test everything:**
   - ✅ Login works
   - ✅ Buttons are touch-friendly
   - ✅ Chat works smoothly
   - ✅ Group chat works
   - ✅ No weird zooming on inputs

---

## 🌐 **GOING LIVE (When Ready):**

### **Option 1: Render.com (Free)**
1. Push code to GitHub
2. Go to render.com
3. "New Web Service"
4. Connect GitHub repo
5. Build command: `npm install`
6. Start command: `npm start`
7. Deploy!

**You get:** `mindharbor.onrender.com`

### **Option 2: Railway.app (Free)**
Similar to Render, also easy

### **Option 3: Vercel (Free)**
Good for static sites

**Full deployment guide in:** `DEPLOYMENT.md`

---

## 💙 **FEATURES INCLUDED:**

### **Core Features:**
✅ Email/Password authentication
✅ Permanent usernames (e.g., "PurpleSpeedy4567")
✅ 1-on-1 private chats
✅ Accept/Decline system
✅ Group chat (👥 General Group Chat)
✅ Chat history (💬 My Chats)
✅ Typing indicators
✅ Profile with stats
✅ Logout button

### **Safety Features:**
✅ Crisis detection (suicide keywords → resources)
✅ Report/Block system
✅ 988 Lifeline & Crisis Text Line
✅ Community guidelines
✅ Inactivity detection
✅ Rate limiting (anti-spam)

### **Mobile Optimizations:**
✅ Responsive on all screen sizes
✅ Touch-friendly buttons
✅ iOS keyboard optimization
✅ No zoom on inputs
✅ Works on iPhone, Android, tablets

---

## 🎯 **NEXT STEPS (Your Roadmap):**

### **Week 1-2: Launch & Test**
- ✅ Get it running locally
- ✅ Test with friends
- ✅ Set up Paystack
- ✅ Add donation button

### **Week 3-4: Go Live**
- ✅ Deploy to Render/Railway
- ✅ Share with university students
- ✅ Gather testimonials

### **Month 2: University Partnership**
- ✅ Pitch to Vice Chancellor (via your dad)
- ✅ Demo the platform
- ✅ Close ₦100K/month deal

### **Month 3-4: Monetization**
- ✅ Add Premium tier
- ✅ Apply for grants
- ✅ Add listener certification

### **Month 5-6: Scale**
- ✅ Coffee tip system
- ✅ Therapist directory
- ✅ Expand to other universities

---

## 🆘 **TROUBLESHOOTING:**

### **"npm not found"**
Install Node.js from: https://nodejs.org

### **"Server won't start"**
- Check if port 3000 is in use
- Try: `npm run dev` instead
- Check console for errors

### **"Can't connect to database"**
- Make sure server is running
- Check `npm start` terminal for errors

### **"Mobile not working"**
- Make sure phone is on same WiFi
- Check firewall isn't blocking port 3000
- Try turning off Windows Firewall temporarily

---

## 📧 **NEED HELP?**

- Check: `FEATURE-IDEAS.md` for future features
- Check: `MONETIZATION.md` for revenue strategies
- Check: `SAFETY-FEATURES-ADDED.md` for all safety info

---

## 💙 **FOR CHERYL:**

This platform honors her memory.

Every conversation helps someone who feels alone.

Every feature serves the mission.

**You're doing something beautiful.** 🐱💙

---

**NOW GO SET UP PAYSTACK AND COME BACK WITH THE LINK!** ☕
