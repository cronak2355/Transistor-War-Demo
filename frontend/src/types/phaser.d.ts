// Phaser 글로벌 타입 선언 - 완전판
declare namespace Phaser {
  class Game {
    constructor(config: Types.Core.GameConfig);
    destroy(removeCanvas: boolean): void;
    scene: Scenes.SceneManager;
    registry: Data.DataManager;
  }

// 이것도 추가 (Game 클래스 바로 아래에)
namespace Data {
  class DataManager {
    set(key: string, value: any): this;
    get(key: string): any;
    remove(key: string): this;
    has(key: string): boolean;
    values: { [key: string]: any };
  }
}

  class Scene {
    add: GameObjects.GameObjectFactory;
    physics: Physics.Arcade.ArcadePhysics;
    input: Input.InputPlugin;
    time: Time.Clock;
    tweens: Tweens.TweenManager;
    load: Loader.LoaderPlugin;
    textures: Textures.TextureManager;
    anims: Animations.AnimationManager;
    children: GameObjects.DisplayList;
    cameras: Cameras.Scene2D.CameraManager;
    scene: Scenes.ScenePlugin;
    
    constructor(config?: string | Types.Scenes.SettingsConfig);
    preload?(): void;
    create?(): void;
    update?(time: number, delta: number): void;
  }

  namespace Scenes {
    class SceneManager {
      getScene(key: string): Scene;
      keys: { [key: string]: Scene };
      start(key: string, data?: object): this;  // ← 추가
      stop(key: string): this;                   // ← 추가
      pause(key: string): this;                  // ← 추가
      resume(key: string): this;                 // ← 추가
    }

    class ScenePlugin {
      start(key: string, data?: object): this;
      restart(data?: object): this;
      stop(key?: string): this;
    }
  }

  namespace Cameras {
    namespace Scene2D {
      class CameraManager {
        main: Camera;
      }

      class Camera {
        shake(duration?: number, intensity?: number, force?: boolean, callback?: Function): this;
        flash(duration?: number, red?: number, green?: number, blue?: number, force?: boolean, callback?: Function): this;
        fade(duration?: number, red?: number, green?: number, blue?: number, force?: boolean, callback?: Function): this;
        setBackgroundColor(color: string | number): this;
      }
    }
  }

  namespace Types {
    namespace Core {
      interface GameConfig {
        type?: number;
        width?: number;
        height?: number;
        parent?: string | HTMLElement;
        backgroundColor?: string | number;
        scene?: typeof Scene | typeof Scene[] | Scene | Scene[] | any;
        physics?: {
          default?: string;
          arcade?: {
            gravity?: { x?: number; y?: number };
            debug?: boolean;
          };
        };
        render?: {
          pixelArt?: boolean;
          antialias?: boolean;
        };
        callbacks?: {
          preBoot?: (game: Game) => void;
          postBoot?: (game: Game) => void;
        };
      }
    }

    namespace Scenes {
      interface SettingsConfig {
        key?: string;
      }
    }

    namespace Input {
      interface InteractiveObject {
        // empty
      }
    }

    namespace Animations {
      interface Animation {
        key: string;
        frames: AnimationFrame[];
        frameRate?: number;
        repeat?: number;
      }

      interface AnimationFrame {
        key: string;
        frame: string | number;
      }

      interface GenerateFrameNumbers {
        start?: number;
        end?: number;
        first?: number;
        frames?: number[];
      }
    }
  }

  namespace GameObjects {
    class GameObject {
      scene: Scene;
      x: number;
      y: number;
      alpha: number;
      visible: boolean;
      active: boolean;
      name: string;
      setDepth(value: number): this;
      setAlpha(value: number): this;
      setVisible(value: boolean): this;
      setActive(value: boolean): this;
      setPosition(x: number, y?: number): this;
      setScale(x: number, y?: number): this;
      setOrigin(x: number, y?: number): this;
      setInteractive(hitArea?: any, callback?: Function, dropZone?: boolean): this;
      removeInteractive(): this;
      on(event: string, fn: Function, context?: object): this;
      off(event: string, fn?: Function, context?: object): this;
      once(event: string, fn: Function, context?: object): this;
      emit(event: string, ...args: any[]): boolean;
      destroy(): void;
    }

    class Container extends GameObject {
      body: Physics.Arcade.Body | null;
      list: GameObject[];
      add(child: GameObject | GameObject[]): this;
      remove(child: GameObject, destroyChild?: boolean): this;
      removeAll(destroyChild?: boolean): this;
      setSize(width: number, height: number): this;
      getAll(): GameObject[];
      iterate(callback: (child: GameObject) => void): void;
      getFirst(property?: string, value?: any, startIndex?: number, endIndex?: number): GameObject | null;
      getByName(name: string): GameObject | null;
      length: number;
    }

    class Sprite extends GameObject {
      body: Physics.Arcade.Body | null;
      anims: Animations.AnimationState;
      setTint(tint: number): this;
      setTintFill(tint: number): this;
      clearTint(): this;
      setFlipX(value: boolean): this;
      setFlipY(value: boolean): this;
      play(key: string, ignoreIfPlaying?: boolean): this;
      setFrame(frame: string | number): this;
      setTexture(key: string, frame?: string | number): this;
    }

    class Rectangle extends GameObject {
      width: number;
      height: number;
      fillColor: number;
      fillAlpha: number;
      setStrokeStyle(lineWidth?: number, color?: number, alpha?: number): this;
      setFillStyle(color?: number, alpha?: number): this;
      setSize(width: number, height: number): this;
    }

    class Text extends GameObject {
      text: string;
      setText(text: string | string[]): this;
      setFill(color: string): this;
      setColor(color: string): this;
      setFontSize(size: number | string): this;
      setFontFamily(family: string): this;
      setStroke(color: string, thickness: number): this;
      setStyle(style: object): this;
      setWordWrapWidth(width: number, useAdvancedWrap?: boolean): this;
    }

    class Image extends GameObject {
      setTint(tint: number): this;
      clearTint(): this;
      setFlipX(value: boolean): this;
      setFlipY(value: boolean): this;
      setFrame(frame: string | number): this;
      setTexture(key: string, frame?: string | number): this;
    }

    class Graphics extends GameObject {
      fillStyle(color: number, alpha?: number): this;
      fillRect(x: number, y: number, width: number, height: number): this;
      fillCircle(x: number, y: number, radius: number): this;
      fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): this;
      fillRoundedRect(x: number, y: number, width: number, height: number, radius?: number): this;
      lineStyle(lineWidth: number, color: number, alpha?: number): this;
      strokeRect(x: number, y: number, width: number, height: number): this;
      strokeCircle(x: number, y: number, radius: number): this;
      strokeTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): this;
      strokeRoundedRect(x: number, y: number, width: number, height: number, radius?: number): this;
      lineBetween(x1: number, y1: number, x2: number, y2: number): this;
      beginPath(): this;
      moveTo(x: number, y: number): this;
      lineTo(x: number, y: number): this;
      closePath(): this;
      strokePath(): this;
      fillPath(): this;
      clear(): this;
      generateTexture(key: string, width?: number, height?: number): this;
    }

    class Arc extends GameObject {
      radius: number;
      setRadius(value: number): this;
    }

    class DisplayList {
      getAll(): GameObject[];
      list: GameObject[];
      length: number;
    }

    class GameObjectFactory {
      container(x?: number, y?: number, children?: GameObject[]): Container;
      sprite(x: number, y: number, texture: string, frame?: string | number): Sprite;
      rectangle(x: number, y: number, width: number, height: number, fillColor?: number, fillAlpha?: number): Rectangle;
      text(x: number, y: number, text: string | string[], style?: object): Text;
      image(x: number, y: number, texture: string, frame?: string | number): Image;
      graphics(config?: object): Graphics;
      circle(x: number, y: number, radius: number, fillColor?: number, fillAlpha?: number): Arc;
      ellipse(x: number, y: number, width: number, height: number, fillColor?: number, fillAlpha?: number): GameObject;
      line(x: number, y: number, x1: number, y1: number, x2: number, y2: number, strokeColor?: number, strokeAlpha?: number): GameObject;
      triangle(x: number, y: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, fillColor?: number, fillAlpha?: number): GameObject;
      existing<T extends GameObject>(child: T): T;
      group(children?: GameObject[] | object, config?: object): Group;
    }

    class Group {
      add(child: GameObject, addToScene?: boolean): this;
      remove(child: GameObject, removeFromScene?: boolean, destroyChild?: boolean): this;
      clear(removeFromScene?: boolean, destroyChild?: boolean): this;
      getChildren(): GameObject[];
      getLength(): number;
    }
  }

  namespace Physics {
    namespace Arcade {
      class ArcadePhysics {
        world: World;
        add: Factory;
        overlap(
          object1: GameObjects.GameObject | GameObjects.GameObject[] | GameObjects.Group,
          object2: GameObjects.GameObject | GameObjects.GameObject[] | GameObjects.Group,
          collideCallback?: Function,
          processCallback?: Function,
          callbackContext?: object
        ): boolean;
        collide(
          object1: GameObjects.GameObject | GameObjects.GameObject[] | GameObjects.Group,
          object2: GameObjects.GameObject | GameObjects.GameObject[] | GameObjects.Group,
          collideCallback?: Function,
          processCallback?: Function,
          callbackContext?: object
        ): boolean;
      }

      class World {
        setBounds(x: number, y: number, width: number, height: number): this;
        enable(object: GameObjects.GameObject | GameObjects.GameObject[]): void;
      }

      class Factory {
        existing(gameObject: GameObjects.GameObject, isStatic?: boolean): GameObjects.GameObject;
        group(children?: GameObjects.GameObject[]): GameObjects.Group;
      }

      class Body {
        velocity: Math.Vector2;
        x: number;
        y: number;
        width: number;
        height: number;
        setVelocity(x: number, y?: number): this;
        setVelocityX(value: number): this;
        setVelocityY(value: number): this;
        setCollideWorldBounds(value: boolean): this;
        setBounce(x: number, y?: number): this;
        setImmovable(value: boolean): this;
        setSize(width: number, height: number, center?: boolean): this;
        setOffset(x: number, y: number): this;
        enable: boolean;
        onWorldBounds: boolean;
      }
    }
  }

  namespace Input {
    class InputPlugin {
      on(event: string, fn: Function, context?: object): this;
      off(event: string, fn?: Function, context?: object): this;
      keyboard: Keyboard.KeyboardPlugin;
      mouse: Mouse.MouseManager;
      activePointer: Pointer;
    }

    class Pointer {
      x: number;
      y: number;
      isDown: boolean;
      worldX: number;
      worldY: number;
    }

    namespace Mouse {
      class MouseManager {
        disableContextMenu(): this;
      }
    }

    namespace Keyboard {
      class KeyboardPlugin {
        addKey(key: string | number): Key;
        addKeys(keys: string | object): object;
        on(event: string, fn: Function, context?: object): this;
        createCursorKeys(): CursorKeys;
      }

      interface CursorKeys {
        up: Key;
        down: Key;
        left: Key;
        right: Key;
        space: Key;
        shift: Key;
      }

      class Key {
        isDown: boolean;
        isUp: boolean;
        on(event: string, fn: Function, context?: object): this;
      }

      const KeyCodes: {
        A: number;
        B: number;
        C: number;
        D: number;
        E: number;
        F: number;
        G: number;
        H: number;
        I: number;
        J: number;
        K: number;
        L: number;
        M: number;
        N: number;
        O: number;
        P: number;
        Q: number;
        R: number;
        S: number;
        T: number;
        U: number;
        V: number;
        W: number;
        X: number;
        Y: number;
        Z: number;
        ZERO: number;
        ONE: number;
        TWO: number;
        THREE: number;
        FOUR: number;
        FIVE: number;
        SIX: number;
        SEVEN: number;
        EIGHT: number;
        NINE: number;
        SPACE: number;
        ENTER: number;
        ESC: number;
        BACKSPACE: number;
        TAB: number;
        SHIFT: number;
        CTRL: number;
        ALT: number;
        UP: number;
        DOWN: number;
        LEFT: number;
        RIGHT: number;
      };
    }
  }

  namespace Time {
    class Clock {
      now: number;
      addEvent(config: TimerEventConfig): TimerEvent;
      delayedCall(delay: number, callback: Function, args?: any[], callbackScope?: object): TimerEvent;
      removeAllEvents(): void;
    }

    interface TimerEventConfig {
      delay?: number;
      callback?: Function;
      args?: any[];
      callbackScope?: object;
      loop?: boolean;
      repeat?: number;
      startAt?: number;
      paused?: boolean;
    }

    class TimerEvent {
      remove(): void;
      destroy(): void;
      paused: boolean;
      elapsed: number;
    }
  }

  namespace Tweens {
    class TweenManager {
      add(config: TweenConfig): Tween;
      killAll(): void;
      killTweensOf(target: object | object[]): void;
    }

    interface TweenConfig {
      targets: object | object[];
      duration?: number;
      delay?: number;
      ease?: string | Function;
      repeat?: number;
      yoyo?: boolean;
      hold?: number;
      alpha?: number | object;
      scale?: number | object;
      scaleX?: number | object;
      scaleY?: number | object;
      x?: number | object;
      y?: number | object;
      angle?: number | object;
      rotation?: number | object;
      props?: object;
      onComplete?: Function;
      onUpdate?: Function;
      onStart?: Function;
      onRepeat?: Function;
      onYoyo?: Function;
      callbackScope?: object;
    }

    class Tween {
      stop(): this;
      remove(): this;
      pause(): this;
      resume(): this;
      restart(): this;
      isPlaying(): boolean;
    }
  }

  namespace Loader {
    class LoaderPlugin {
      spritesheet(key: string, url: string, frameConfig: { frameWidth: number; frameHeight: number; startFrame?: number; endFrame?: number; margin?: number; spacing?: number }): this;
      image(key: string, url: string): this;
      audio(key: string, urls: string | string[]): this;
      atlas(key: string, textureURL: string, atlasURL: string): this;
      json(key: string, url: string): this;
      on(event: string, fn: Function, context?: object): this;
      start(): void;
      setPath(path: string): this;
    }
  }

  namespace Textures {
    class TextureManager {
      exists(key: string): boolean;
      get(key: string): Texture;
      addCanvas(key: string, source: HTMLCanvasElement): Texture;
    }

    class Texture {
      key: string;
      getSourceImage(): HTMLImageElement | HTMLCanvasElement;
    }
  }

  namespace Animations {
    class AnimationManager {
      create(config: Types.Animations.Animation): Animation;
      generateFrameNumbers(key: string, config?: Types.Animations.GenerateFrameNumbers): Types.Animations.AnimationFrame[];
      generateFrameNames(key: string, config?: object): Types.Animations.AnimationFrame[];
      exists(key: string): boolean;
      get(key: string): Animation;
      remove(key: string): Animation;
    }

    class Animation {
      key: string;
      frames: Types.Animations.AnimationFrame[];
      frameRate: number;
      repeat: number;
    }

    class AnimationState {
      play(key: string, ignoreIfPlaying?: boolean): Phaser.GameObjects.Sprite;
      stop(): Phaser.GameObjects.Sprite;
      pause(): Phaser.GameObjects.Sprite;
      resume(): Phaser.GameObjects.Sprite;
      currentAnim: Animation | null;
      currentFrame: Types.Animations.AnimationFrame | null;
      isPlaying: boolean;
      isPaused: boolean;
    }
  }

  namespace Math {
    class Vector2 {
      x: number;
      y: number;
      set(x: number, y?: number): this;
      setTo(x: number, y?: number): this;
      copy(src: Vector2): this;
      clone(): Vector2;
      add(src: Vector2): this;
      subtract(src: Vector2): this;
      multiply(src: Vector2): this;
      scale(value: number): this;
      normalize(): this;
      length(): number;
      lengthSq(): number;
      distance(src: Vector2): number;
      distanceSq(src: Vector2): number;
      angle(): number;
    }

    function Between(min: number, max: number): number;
    function Distance(x1: number, y1: number, x2: number, y2: number): number;
    function Angle(x1: number, y1: number, x2: number, y2: number): number;
    function FloatBetween(min: number, max: number): number;
    function Clamp(value: number, min: number, max: number): number;
    function DegToRad(degrees: number): number;
    function RadToDeg(radians: number): number;

    namespace Easing {
      namespace Linear {
        function Linear(v: number): number;
      }
      namespace Quadratic {
        function In(v: number): number;
        function Out(v: number): number;
        function InOut(v: number): number;
      }
      namespace Cubic {
        function In(v: number): number;
        function Out(v: number): number;
        function InOut(v: number): number;
      }
    }
  }

  namespace Display {
    namespace Color {
      function IntegerToColor(color: number): Color;
      function IntegerToRGB(color: number): { r: number; g: number; b: number; a: number };
      function HexStringToColor(hex: string): Color;
      function GetColor(red: number, green: number, blue: number): number;
    }

    class Color {
      r: number;
      g: number;
      b: number;
      a: number;
      color: number;
      setTo(red: number, green: number, blue: number, alpha?: number): this;
    }
  }

  namespace Utils {
    namespace Array {
      function Shuffle<T>(array: T[]): T[];
      function GetRandom<T>(array: T[]): T;
    }
  }

  const AUTO: number;
  const WEBGL: number;
  const CANVAS: number;
  const HEADLESS: number;
}

// 글로벌 Phaser 선언
declare const Phaser: typeof Phaser;
