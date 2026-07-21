# Clonk Tennis

## To build the C version


```sh
./scripts/build-native.sh
./build-native/tennis
```

## Building web version


```sh
./scripts/setup-emsdk.sh
```


```sh
./scripts/build-web.sh
python -m http.server -d build-web 8000
#open http://localhost:8000/tennis.html
```

Tennis racket from https://www.artstation.com/marketplace/p/LO8dg/cartoon-tennis-racket-3d-model
Music from https://pixabay.com/music/upbeat-retro-arcade-game-music-297305/
