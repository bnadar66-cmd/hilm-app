# تطبيق حلم — Expo / React Native

نسخة البداية الحقيقية من تطبيق حلم — **مشروع مستقل بالكامل عن موقع hilmlearning.com**:
- Supabase: مشروع منفصل باسم "تطبيق حلم" (id: `oqjcjxjnlqzwijnavbzr`)
- GitHub: مستودع منفصل [`bnadar66-cmd/hilm-app`](https://github.com/bnadar66-cmd/hilm-app)

## ✅ الجاهز حاليًا
- شاشات التسجيل / تسجيل الدخول / التحقق (OTP) — **متصلة فعليًا** بـ Supabase Auth
- عند نجاح التحقق، يُنشأ حساب حقيقي + يُحفظ ملف الطالب بجدول `students`
- شاشة رئيسية بسيطة تثبت إن الدخول شغّال وتعرض بيانات الطالب الحقيقية

## 🚧 الخطوة القادمة (لسا ما بنيناها)
- شريط التنقل السفلي بأربع صفحات (الرئيسية، دوراتي، استكشف، حسابي) بمحتواها الكامل
- صفحة الدورة وصفحة المحاضرة
- واجهتا المعلم والأدمن

## قبل التشغيل — إعداد مطلوب من طرفكم

### 1) تفعيل إرسال OTP عبر جوال فعليًا
اذهب للوحة Supabase → **Authentication → Providers → Phone**، وفعّل مزود SMS (Twilio أو غيره).
بدون هذا، دالة `signInWithOtp({ phone })` ما راح ترسل رسالة فعلية.

> بديل أسرع للتجربة بدون Twilio: بدّل الحقل من `phone` إلى `email` بملفي
> `SignupScreen.js` و`LoginScreen.js` و`OtpScreen.js` (`type: 'email'` بدل `'sms'`)
> — البريد يشتغل تلقائيًا بحساب Supabase بدون إعداد إضافي (بحدود استخدام منخفضة).

### 2) تثبيت الحزم والتشغيل محليًا
```bash
npm install
npx expo start
```
افتح تطبيق **Expo Go** على جوالك وامسح رمز QR اللي بيطلع بالطرفية.

### 3) رفع الكود لمستودع GitHub الخاص بالتطبيق
المستودع أنشأناه فاضي (فيه README بس). ارفع هذا الكود له بـ git:
```bash
git init
git remote add origin https://github.com/bnadar66-cmd/hilm-app.git
git add .
git commit -m "بداية تطبيق حلم"
git branch -M main
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## 🚀 لما توصل لمرحلة الرفع الفعلي لـ Apple App Store
1. أنشئ حساب على [expo.dev](https://expo.dev) وثبّت أداة EAS:
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```
2. عدّل `app.json` → غيّر `extra.eas.projectId` للقيمة اللي تعطيك ياها EAS
3. ابنِ نسخة iOS (يحتاج حساب Apple Developer الـ99$ فعّال):
   ```bash
   eas build --platform ios
   ```
4. ارفعها لـ App Store Connect:
   ```bash
   eas submit --platform ios
   ```

## بنية المشروع
```
App.js                     نقطة الدخول — يبدّل بين شاشات الدخول والتطبيق حسب الجلسة
src/
  lib/
    supabase.js             اتصال Supabase
    AuthContext.js           إدارة حالة الجلسة والملف الشخصي
  screens/
    WelcomeScreen.js
    SignupScreen.js
    LoginScreen.js
    OtpScreen.js
    HomeScreen.js
  navigation/
    AuthNavigator.js
  theme/
    theme.js                 الألوان والخطوط (نفس هوية حلم)
    InputCard.js              حقل الإدخال بنمط "التسجيل"
```
