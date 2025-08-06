# 画像アセットの使用方法

提供されたPNG画像をゲームに組み込む方法を説明します。

## 📁 提供された画像

1. **プレイヤースプライト** - 緑色の戦車のような機体
2. **弾丸スプライト** - 黄色の弾丸
3. **敵スプライト** - 灰色の敵機

## 🚀 画像をゲームに追加する手順

### 方法1: GitHubリポジトリに直接アップロード

1. GitHubのリポジトリページで `assets/images/` フォルダに移動
2. 「Add file」→「Upload files」をクリック
3. 3つのPNG画像をアップロード：
   - `player.png` (プレイヤースプライト)
   - `enemy.png` (敵スプライト)
   - `bullet.png` (弾丸スプライト)

### 方法2: Base64エンコードして直接組み込み

以下のJavaScriptコードを使用して、画像をbase64エンコードしてゲームに直接埋め込むことができます：

```javascript
// game.jsのpreload()メソッドに以下を追加：

preload() {
    // Base64エンコードされた画像データ（例）
    const playerImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h..."; // 実際のbase64データ
    const enemyImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h..."; // 実際のbase64データ
    const bulletImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h..."; // 実際のbase64データ
    
    this.load.image('player-sprite', playerImageData);
    this.load.image('enemy-sprite', enemyImageData);
    this.load.image('bullet-sprite', bulletImageData);
    
    // 既存のcreateSprites()も呼び出してフォールバック用にする
    this.createSprites();
}
```

## 🔧 Base64エンコード方法

### オンラインツールを使用
1. [Base64 Image Encoder](https://www.base64-image.de/)にアクセス
2. PNG画像をアップロード
3. 生成されたbase64文字列をコピー
4. 上記のJavaScriptコードに貼り付け

### コマンドライン（Linux/Mac）
```bash
base64 -i player.png -o player_base64.txt
base64 -i enemy.png -o enemy_base64.txt
base64 -i bullet.png -o bullet_base64.txt
```

### Node.js
```javascript
const fs = require('fs');

function imageToBase64(imagePath) {
    const image = fs.readFileSync(imagePath);
    return `data:image/png;base64,${image.toString('base64')}`;
}

console.log('Player:', imageToBase64('player.png'));
console.log('Enemy:', imageToBase64('enemy.png'));
console.log('Bullet:', imageToBase64('bullet.png'));
```

## 🎮 現在の実装について

現在のゲームは以下のフォールバック戦略を使用しています：

1. **PNGファイルが利用可能**: 実際の画像を使用
2. **PNGファイルが未使用**: プログラム生成されたスプライトを使用

この設計により、画像がなくてもゲームは完全に動作し、画像を追加すると自動的により良いビジュアルに切り替わります。

## 📝 画像スペック推奨事項

- **プレイヤー**: 16x16ピクセル、PNG形式、透明背景推奨
- **敵**: 16x16ピクセル、PNG形式、透明背景推奨
- **弾丸**: 8x8ピクセル、PNG形式、透明背景推奨
- **カラーモード**: RGBA（透明度サポート）
- **最適化**: できるだけ小さなファイルサイズ

## 🔍 テスト方法

1. 画像を追加後、ゲームを実行
2. ブラウザの開発者コンソールで以下を確認：
   ```javascript
   // スプライトが読み込まれているかチェック
   console.log('Player sprite loaded:', game.scene.scenes[0].textures.exists('player-sprite'));
   console.log('Enemy sprite loaded:', game.scene.scenes[0].textures.exists('enemy-sprite'));
   console.log('Bullet sprite loaded:', game.scene.scenes[0].textures.exists('bullet-sprite'));
   ```

## 🎨 さらなるカスタマイズ

### アニメーションの追加
```javascript
// create()メソッドでアニメーションを定義
this.anims.create({
    key: 'player-idle',
    frames: [{ key: 'player-sprite', frame: 0 }],
    frameRate: 10,
    repeat: -1
});
```

### スプライトシートの使用
複数フレームのアニメーションが必要な場合：
```javascript
this.load.spritesheet('player-animated', 'assets/images/player-sheet.png', {
    frameWidth: 16,
    frameHeight: 16
});
```

## 🚨 トラブルシューティング

### 画像が表示されない場合
1. ファイルパスが正しいか確認
2. 画像ファイルのサイズと形式を確認
3. ブラウザの開発者コンソールでエラーをチェック
4. キャッシュクリアを試行

### パフォーマンス最適化
- 大きな画像は避ける（推奨: 各スプライト < 5KB）
- Base64エンコードは小さな画像にのみ使用
- スプライトシートで複数の画像をまとめる

---

**注意**: 現在のゲームは画像がなくても完全に動作するように設計されています。画像を追加することで、よりリッチな視覚体験を提供できます。