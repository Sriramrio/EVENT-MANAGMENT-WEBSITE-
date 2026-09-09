import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./app/router";
import { appConfig } from "./config/appConfig";
// import { ensureSeeded } from './data/dexie/seed';
import { createRoot } from "react-dom/client";
// import './styles/index.css'
// import { AppProviders } from '@/ap
// import { AppRouter } from '@/app/router/router';
import { AppProviders } from "./app/providers/AppProviders";

async function bootstrap() {
  // if (appConfig.dataMode === 'dexie') await ensureSeeded();
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </React.StrictMode>,
  );
}

bootstrap();
