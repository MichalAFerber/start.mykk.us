# To Deploy

cd ~/start.mykk.us
git pull --rebase
docker compose up --build -d
docker compose logs -f
