# Registro de Fuerza y Pliometría

Esta es una aplicación web desarrollada con **React**, **TypeScript** y **Vite** que permite llevar un registro de tus entrenamientos de fuerza y pliometría. Incluye un plan de entreno para corredores (Día A y Día B) y un sistema de registro que guarda los datos en *localStorage*.

## Características

- Plan estático de 4 semanas con ejercicios para Día A y Día B.
- Registro de cargas, repeticiones, RPE y notas por ejercicio.
- Filtrado por semana, día y búsqueda en notas.
- Carga de plantillas de series por ejercicio.
- Exportación e importación de datos en CSV.
- Almacenamiento local (persistencia en el navegador).
- Debug interno con pruebas básicas.

## Estructura del proyecto

```
fuerza-app/
├─ src/
│  ├─ App.tsx            → Componente principal que muestra el plan y el registro
│  ├─ StrengthLogApp.tsx → Lógica y UI del registro
│  ├─ main.tsx           → Punto de entrada de React
│  └─ index.css          → Configuración de Tailwind CSS
├─ index.html            → Documento HTML base
├─ package.json          → Dependencias y scripts
├─ tailwind.config.cjs   → Configuración de Tailwind CSS
├─ postcss.config.cjs    → Configuración de PostCSS
└─ vercel.json           → Política CSP para incrustar en iframe
```

## Instalación y desarrollo

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Ejecuta la aplicación en modo desarrollo:

   ```bash
   npm run dev
   ```

   Abre `http://localhost:5173` en tu navegador para verla.

3. Genera la versión de producción:

   ```bash
   npm run build
   ```

4. Previsualiza la build de producción localmente:

   ```bash
   npm run preview
   ```

## Despliegue en Vercel

Para desplegar esta aplicación en Vercel:

1. Crea un repositorio en GitHub con el contenido de `fuerza-app`.
2. Inicia sesión en [Vercel](https://vercel.com) y selecciona **New Project**.
3. Importa tu repositorio desde GitHub.
4. Configura Vercel para usar **Vite** como framework. Vercel detectará automáticamente el comando de build (`npm run build`) y el directorio de salida (`dist`).
5. Una vez desplegada, tu aplicación estará disponible en una URL de Vercel. Puedes incrustarla en tu sitio WordPress mediante un iframe.

## Notas

- La aplicación utiliza Tailwind CSS para estilos utilitarios.
- Los datos se guardan en `localStorage`, por lo que cada navegador mantiene sus propios registros.
- El archivo `vercel.json` añade un encabezado CSP para permitir que la aplicación se cargue dentro de un iframe en el dominio `tri-naranjus.com`.