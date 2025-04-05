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
heroku create discord-bot-bison # すでにあったら不要
heroku stack:set container -a discord-bot-bison
heroku container:push web -a discord-bot-bison
```

環境変数設定　(最初の1回)
```
heroku config:set LISTENER_CLIENT_ID=${LISTENER_CLIENT_ID} -a discord-bot-bison
heroku config:set LISTENER_TOKEN=${LISTENER_TOKEN} -a discord-bot-bison
heroku config:set SPEAKER_CLIENT_ID=${SPEAKER_CLIENT_ID} -a discord-bot-bison
heroku config:set SPEAKER_TOKEN=${SPEAKER_TOKEN} -a discord-bot-bison
```

起動　(最初の1回)
```
heroku container:release web -a discord-bot-bison
```

起動
```
heroku ps:scale web=1 -a discord-bot-bison
```

停止
```
heroku ps:scale web=0 -a discord-bot-bison
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
