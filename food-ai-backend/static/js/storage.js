// This file handles all data storage and retrieval
// For a real application, you would replace this with actual API calls to your backend

const STORAGE_KEY = 'foodAIUser';

function saveUserData(userData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return true;
    } catch (error) {
        console.error('Failed to save user data:', error);
        return false;
    }
}

function loadUserData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to load user data:', error);
        return null;
    }
}

function clearUserData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear user data:', error);
        return false;
    }
}

export {
    saveUserData,
    loadUserData,
    clearUserData
};