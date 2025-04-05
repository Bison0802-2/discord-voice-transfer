# stream-bot
## 使い方
* direnvを用いて環境変数の設定をする。``
`.envrc template` をコピーし、`.envrc`を作成。discordのdevelopper画面を参考にしつつ、中身を記載。
discordの開発者画面を開いて、**BOT**タブのトークンを登録する！！！それっぽいのが他のタブにもあるが間違えないようにする。
`direnv allow` を実行。
`docker-compose up`

## herokuによるデプロイ

```
heroku login
geroku create
```

```
docker-compose up
```

```
heroku container:push discord-bot
```

## Discord上での使い方

* BOTに`Pong!`と返信してほしい時
    - `/ping`を実行。

* VCによくわからん音を流したい時
    - `/join`、`/play`を実行。

* VCの音を録音したい時
    - `index.js`の階層で`rec`というフォルダを作成。
    - `/join`、`/record`を実行。

* VCの音を別のVCに中継したい時
    - `/stream`を実行。
