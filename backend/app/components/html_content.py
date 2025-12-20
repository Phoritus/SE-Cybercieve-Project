HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CyberSieve</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* 2. Set beautiful font (Inter) */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">

    <div class="bg-white p-10 md:p-12 rounded-xl shadow-2xl text-center max-w-lg mx-4">
        
        <svg class="mx-auto block" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 36 36">
        <path fill="#aab8c2" d="M13 3C7.477 3 3 7.477 3 13v10h4V13a6 6 0 0 1 12 0v10h4V13c0-5.523-4.477-10-10-10" />
        <path fill="#ffac33" d="M26 32a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4z" />
        <path fill="#c1694f" d="M35 9c0-4.971-4.029-9-9-9s-9 4.029-9 9c0 3.917 2.507 7.24 6 8.477V33.5a2.5 2.5 0 0 0 4.95.49c.018.001.032.01.05.01a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1v-1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1v-2.277A1.99 1.99 0 0 0 29 22v-4.523c3.493-1.236 6-4.559 6-8.477m-9-7a2 2 0 1 1-.001 4.001A2 2 0 0 1 26 2" />
        </svg>

        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mt-6">
            CyberSieve API
        </h1>
        
        <p class="text-gray-600 mt-3 text-lg">
            A robust backend for User Management and Authentication services.
        </p>
        
        <div class="mt-8 flex flex-col md:flex-row justify-center gap-4">
            <a href="/docs" 
            class="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300">
                Swagger UI
            </a>
            <a href="/redoc" 
            class="px-8 py-3 bg-gray-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-300">
                Redoc
            </a>
        </div>
    </div>

</body>
</html>
"""
