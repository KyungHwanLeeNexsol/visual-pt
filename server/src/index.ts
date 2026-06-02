// 로컬 개발 전용 진입점 — Vercel 배포 시에는 api/index.ts 사용
import app from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Visual PT 서버가 포트 ${PORT}에서 실행 중입니다`);
});
