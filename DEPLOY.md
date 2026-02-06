# 🚀 Deployment Guide: Deploying SyndicPro to Vercel

This guide will walk you through deploying your **SyndicPro** application to Vercel. Since this is a React Vite app using Supabase, there are a few specific steps to ensure everything works perfectly.

---

## 📋 Prerequisites

1.  **GitHub Account**: You need a GitHub account to host your code.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account.
3.  **Supabase Credentials**: You will need your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 🛠️ Step 1: Push Your Code to GitHub

If you haven't already pushed your code to GitHub, do this first:

1.  Create a **New Repository** on GitHub (e.g., `syndicpro-app`).
2.  Open your terminal in the project folder (`client`).
3.  Run the following commands:
    ```bash
    git init
    git add .
    git commit -m "Initial commit - Ready for deployment"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/syndicpro-app.git
    git push -u origin main
    ```
    *(Replace `YOUR_USERNAME` with your actual GitHub username)*

---

## ☁️ Step 2: Import Project to Vercel

1.  Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2.  Click **"Add New..."** -> **"Project"**.
3.  You should see your `syndicpro-app` repository in the list. Click **"Import"**.

---

## ⚙️ Step 3: Configure Project Settings

Vercel will detect that this is a **Vite** project automatically.

1.  **Framework Preset**: Ensure it says `Vite`.
2.  **Root Directory**: If your project is inside a folder (like `client`), click "Edit" and select the `client` folder. If it's at the root of the repo, leave it as `./`. 
    *(Based on your current setup, ensure you select the folder containing `package.json`)*.

---

## 🔑 Step 4: Environment Variables (CRITICAL)

**Do not skip this step!** Your app needs to know how to connect to Supabase.

1.  Expand the **"Environment Variables"** section.
2.  Add the following variables one by one (copy them from your local `.env` file):

    | Name | Value |
    | :--- | :--- |
    | `VITE_SUPABASE_URL` | `your_supabase_project_url` |
    | `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key` |

3.  Click **Add** after entering each one.

---

## 🚀 Step 5: Deploy

1.  Click the big **"Deploy"** button.
2.  Wait for the build to complete (usually takes 1-2 minutes).
3.  Once done, you will see a generic "Congratulations!" screen.
4.  Click on the **Preview** image to open your live app!

---

## ✅ Step 6: Verify Deployment

1.  **Test Routing**: Navigate to different pages (e.g., Dashboard -> Payments). Refresh the page.
    *   *If you see a 404 error on refresh, ensure the `vercel.json` file I passed you is in the root of your project.*
2.  **Test Data**: Ensure you can see your apartments and payments.
    *   *If data is missing, check your Console (F12) for connection errors. Usually, this means the Environment Variables were not pasted correctly.*

---

## 🔄 Updating Your App

Whenever you want to update the live site:
1.  Make changes locally.
2.  Commit and push to GitHub:
    ```bash
    git add .
    git commit -m "Updated features"
    git push
    ```
3.  Vercel will **automatically** detect the change and re-deploy your site!
