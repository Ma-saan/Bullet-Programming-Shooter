# Assets Directory

このディレクトリには、ゲームで使用される画像とサウンドファイルが含まれています。

## Images
- `player.png` - プレイヤーのスプライト（16x16推奨）
- `enemy.png` - 敵のスプライト（16x16推奨）  
- `bullet.png` - 弾丸のスプライト（8x8推奨）

## 使用方法

PNG画像をこのディレクトリにアップロードした後、game.jsのpreload()メソッドで以下のように読み込みます：

```javascript
this.load.image('player-sprite', 'assets/images/player.png');
this.load.image('enemy-sprite', 'assets/images/enemy.png');
this.load.image('bullet-sprite', 'assets/images/bullet.png');
```

現在は、PNGファイルが利用できない場合に備えて、プログラム的に生成されたスプライトをフォールバックとして使用しています。
