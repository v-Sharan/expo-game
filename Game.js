import React, { useState } from "react";
import { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useAnimatedGestureHandler,
  withSequence,
  BounceIn,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";

const FPS = 60;
const DELTA = 500 / FPS;
const SPEED = 10;
const BALL_WIDTH = 25;

const islandDimensions = { x: 150, y: 11, w: 127, h: 37 };

const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
};

export default function Game() {
  const { height, width } = useWindowDimensions();
  const playerDimensions = {
    w: width / 2,
    h: 37,
  };

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(true);

  const targetPositionX = useSharedValue(width / 2);
  const targetPositionY = useSharedValue(height / 2);
  const direction = useSharedValue(
    normalizeVector({ x: Math.random(), y: Math.random() })
  );
  const playerPos = useSharedValue({ x: width / 4, y: height - 100 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        update();
      }
    }, DELTA);

    return () => clearInterval(interval);
  }, [gameOver]);

  const update = () => {
    let nextPos = getNextPos(direction.value);
    let newDirection = direction.value;

    // Wall Hit detection
    if (nextPos.y > height - BALL_WIDTH) {
      setGameOver(true);
    }
    if (nextPos.y < 0) {
      newDirection = { x: direction.value.x, y: -direction.value.y };
    }

    if (nextPos.x < 0 || nextPos.x > width - BALL_WIDTH) {
      newDirection = { x: -direction.value.x, y: direction.value.y };
    }

    // Island Hit detection
    if (
      nextPos.x < islandDimensions.x + islandDimensions.w &&
      nextPos.x + BALL_WIDTH > islandDimensions.x &&
      nextPos.y < islandDimensions.y + islandDimensions.h &&
      BALL_WIDTH + nextPos.y > islandDimensions.y
    ) {
      if (
        targetPositionX.value < islandDimensions.x ||
        targetPositionX.value > islandDimensions.x + islandDimensions.w
      ) {
        newDirection = { x: -direction.value.x, y: direction.value.y };
      } else {
        newDirection = { x: direction.value.x, y: -direction.value.y };
      }
      setScore((s) => s + 1);
    }

    // Player Hit detection
    if (
      nextPos.x < playerPos.value.x + playerDimensions.w &&
      nextPos.x + BALL_WIDTH > playerPos.value.x &&
      nextPos.y < playerPos.value.y + playerDimensions.h &&
      BALL_WIDTH + nextPos.y > playerPos.value.y
    ) {
      if (
        targetPositionX.value < playerPos.value.x ||
        targetPositionX.value > playerPos.value.x + playerDimensions.w
      ) {
        newDirection = { x: -direction.value.x, y: direction.value.y };
      } else {
        newDirection = { x: direction.value.x, y: -direction.value.y };
      }
    }

    direction.value = newDirection;
    nextPos = getNextPos(newDirection);

    targetPositionX.value = withTiming(nextPos.x, {
      duration: DELTA,
      easing: Easing.linear,
    });
    targetPositionY.value = withTiming(nextPos.y, {
      duration: DELTA,
      easing: Easing.linear,
    });
  };

  const getNextPos = (direction) => {
    return {
      x: targetPositionX.value + direction.x * SPEED,
      y: targetPositionY.value + direction.y * SPEED,
    };
  };

  const restartGame = () => {
    targetPositionX.value = width / 2;
    targetPositionY.value = height / 2;
    setScore(0);
    setGameOver(false);
  };

  const ballAnimatedStyles = useAnimatedStyle(() => {
    return {
      top: targetPositionY.value,
      left: targetPositionX.value,
    };
  });

  const playerAnimatedStyles = useAnimatedStyle(() => ({
    left: playerPos.value.x,
  }));

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      playerPos.value = {
        ...playerPos.value,
        x: event.absoluteX - playerDimensions.w / 2,
      };
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.score}>{score}</Text>
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOver}>Game over</Text>
          <Pressable onPress={restartGame} style={styles.Button}>
            <Text style={styles.buttonText}>Restart</Text>
          </Pressable>
        </View>
      )}

      {!gameOver && <Animated.View style={[styles.ball, ballAnimatedStyles]} />}

      {/* Island */}
      <Animated.View
        entering={BounceIn}
        key={score}
        style={[
          {
            position: "absolute",
            top: islandDimensions.y + 20,
            left: islandDimensions.w,
            width: islandDimensions.x,
            height: islandDimensions.h,
            position: "absolute",
            borderRadius: 20,
            backgroundColor: "black",
          },
        ]}
      />

      {/* Player */}
      <Animated.View
        style={[
          {
            top: playerPos.value.y,
            position: "absolute",
            width: playerDimensions.w,
            height: playerDimensions.h,
            borderRadius: 20,
            backgroundColor: "black",
          },
          playerAnimatedStyles,
        ]}
      />

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={{
            width: "100%",
            height: 200,
            position: "absolute",
            bottom: 0,
          }}
        />
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  ball: {
    backgroundColor: "black",
    width: BALL_WIDTH,
    aspectRatio: 1,
    borderRadius: 25,
    position: "absolute",
  },
  score: {
    fontSize: 150,
    fontWeight: "500",
    position: "absolute",
    top: 150,
    color: "lightgray",
  },
  gameOverContainer: {
    position: "absolute",
    top: 350,
  },
  gameOver: {
    fontSize: 50,
    fontWeight: "500",
    color: "red",
  },
  Button: {
    backgroundColor: "black",
    padding: 10,
    width: 150,
    borderRadius: 20,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    paddingVertical: 5,
    fontWeight: "bold",
    fontSize: 20,
  },
});
