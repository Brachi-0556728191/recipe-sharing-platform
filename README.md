# 🍲 MealMate - Smart Recipe Sharing Platform

MealMate is a modern, full-stack recipe management system designed to help users discover what they can cook with what they already have. From advanced ingredient-based searching to professional image processing, MealMate bridges the gap between the fridge and the plate.



## 🚀 Key Features

* **Smart "Fridge Search":** Enter your ingredients and get recipes ranked by compatibility.
* **Automated Image Processing:** Every uploaded recipe image is automatically processed into multiple artistic variations (Grayscale, Blur, Contour) using Python's Pillow library.
* **Role-Based Access Control (RBAC):** Secure tiered system for Users, Content Creators, and Administrators.
* **Interactive Community:** Full Rating & Commenting system with real-time UI updates.
* **Shopping List Generator:** One-click "Print-friendly" shopping list generation based on missing ingredients.
* **Responsive UI:** Beautifully crafted with **Bootstrap** and **SweetAlert2** for a seamless mobile/desktop experience.

## 🛠 Tech Stack

### Frontend
* **Framework:** Angular (Standalone Components)
* **State Management:** Angular Signals & RxJS
* **Styling:** Bootstrap 5, Custom CSS
* **Notifications:** SweetAlert2

### Backend
* **Framework:** Flask (Python)
* **Architecture:** Modular Blueprints
* **ORM:** SQLAlchemy
* **Database:** SQLite
* **Image Processing:** Pillow (PIL)

## 🏗 System Architecture

The project follows a clean separation of concerns:
- **Modular Routes:** Organized using Flask Blueprints for scalability.
- **Base Models:** Implemented DRY principle in the database layer using Abstract Base Classes.
- **Custom Decorators:** Secure authentication and authorization checks at the API level.

## 🏁 Getting Started

1. **Clone the repo:** `git clone https://github.com/your-username/mealmate.git`
2. **Backend Setup:**
   - Install dependencies: `pip install -r requirements.txt`
   - Run the DB setup script: `python create_db.py`
   - Start the server: `python app.py`
3. **Frontend Setup:**
   - Install dependencies: `npm install`
   - Run the app: `ng serve`





# MealMate - פלטפורמה לשיתוף וחיפוש מתכונים

מערכת Full-Stack מתקדמת לניהול מתכונים, המאפשרת למשתמשים לגלות מנות חדשות על סמך המצרכים שיש להם בבית, לשתף מתכונים משלהם ולנהל אינטראקציה חברתית.

## 🚀 תכונות עיקריות
- **חיפוש לפי רכיבים:** אלגוריתם החוזה ומציג מתכונים עם אחוז התאמה גבוה למצרכים שהוזנו.
- **ניהול משתמשים והרשאות:** מערכת הכוללת הרשמה, התחברות, ותפקידי משתמשים (צופה, יוצר תוכן, מנהל).
- **גלריית תמונות חכמה:** עיבוד תמונות אוטומטי בשרת ליצירת אפקטים ווריאציות (שחור-לבן, טשטוש וכו').
- **דירוגים ותגובות:** אפשרות למשוב קהילתי על מתכונים.
- **רשימת קניות:** יצירת רשימת קניות אוטומטית המבוססת על המצרכים החסרים למתכון.

## 🛠 טכנולוגיות
- **Client:** Angular 17+, RxJS, Signals, CSS3.
- **Server:** Python (Flask), Flask-SQLAlchemy.
- **Database:** SQLite.
- **Libraries:** Pillow (עיבוד תמונות), SweetAlert2 (הודעות UI), Werkzeug.

## 💻 התקנה והרצה
1. התקנת דרישות פייתון: `pip install -r requirements.txt`
2. הרצת השרת: `python app.py`
3. הרצת הלקוח (Angular): `ng serve`
