// 1. API va Telegram Sozlamalari
const API_URL = "https://script.google.com/macros/s/AKfycbyELe4JB8a4NpmaZr2wlonnOwu9gDIkumw3JEu2VuMyl--pwImUrcvkG4e5H1GnONk9Pw/exec"; 
const tg = window.Telegram.WebApp;
tg.expand();

// Foydalanuvchi ma'lumotlari
const user = tg.initDataUnsafe?.user;
const employeeName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : "Test User";
const telegramId = user ? String(user.id) : "Yo'q";

// Global O'zgaruvchilar
let globalAdminData = [];   // Barcha admin ma'lumotlari
let filteredData = [];      // Filtrlangan admin ma'lumotlari
let myFullRecords = [];     // Xodimning shaxsiy ma'lumotlari
let myFilteredRecords = []; // Xodimning filtrlangan ma'lumotlari
let currentPage = 1;        // Paginatsiya uchun
const ITEMS_PER_PAGE = 10; 
let myRole = 'User';        // Foydalanuvchi roli
