import { supabase } from "../supabase";

/**
 * Run this function ONCE to create an admin profile for the currently logged-in user
 * 
 * HOW TO USE:
 * 1. Import this function in your component (e.g., Settings.jsx or Dashboard.jsx)
 * 2. Add a button that calls this function
 * 3. Click the button once while logged in
 * 4. Refresh the page
 * 5. You should now be an admin!
 */
export const createAdminProfile = async () => {
    console.log("🔵 createAdminProfile function called!");

    try {
        console.log("🔵 Checking current user...");
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("🔵 Current user:", user);

        if (userError || !user) {
            console.error("❌ No user is currently logged in!", userError);
            alert("Please log in first!");
            return;
        }

        const adminProfile = {
            id: user.id,
            email: user.email,
            role: 'admin',
            permissions: {
                canModify: true,
                canView: true,
                canManageUsers: true
            },
            created_at: new Date().toISOString(),
            display_name: user.email.split('@')[0]
        };

        console.log("🔵 Admin profile data:", adminProfile);
        console.log("🔵 Saving to Supabase...");

        const { error } = await supabase
            .from('profiles')
            .upsert(adminProfile);

        if (error) throw error;

        console.log("✅ Admin profile created successfully!");
        alert("✅ Admin profile created! The page will refresh now.");

        // Refresh the page to load the new profile
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error("❌ Error creating admin profile:", error);
        console.error("❌ Error details:", error.message);
        alert(`Error: ${error.message}\n\nCheck the browser console for more details.`);
    }
};
