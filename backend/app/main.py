from app.api.users import router as users_router
from app.api.files_manage import router as files_router
from app.api.recommend import router as recommend_router
from app.api.statistics import router as stats_router

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.components.html_content import HTML_CONTENT

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://cybersieve-se.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
def read_root():
    return HTML_CONTENT


app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(files_router, prefix="/api/files", tags=["files"])
app.include_router(recommend_router, prefix="/api/recommend", tags=["recommendation"])
app.include_router(stats_router, prefix="/api/files", tags=["statistics"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
