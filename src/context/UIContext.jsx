import React, { createContext, useState, useContext, useEffect } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    return (
        <UIContext.Provider value={{ darkMode, toggleDarkMode, searchQuery, setSearchQuery }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);
