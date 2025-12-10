package com.transistorwar.controller

import com.transistorwar.dto.*
import com.transistorwar.service.GameRoomService
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Controller
import java.security.Principal

@Controller
class GameWebSocketController(
    private val messagingTemplate: SimpMessagingTemplate,
    private val GameRoomService: GameRoomService
) {

    // 방 참가
    @MessageMapping("/game.join")
    fun joinRoom(@Payload message: GameMessage, principal: Principal?) {
        val roomCode = message.roomCode

        // 방에 있는 모든 사람에게 알림
        messagingTemplate.convertAndSend(
            "/topic/room/$roomCode",
            GameMessage(
                type = GameMessageType.JOIN_ROOM,
                roomCode = roomCode,
                playerId = message.playerId,
                data = mapOf("message" to "플레이어가 참가했습니다")
            )
        )
    }

    // 게임 시작
    @MessageMapping("/game.start")
    fun startGame(@Payload message: GameMessage) {
        val roomCode = message.roomCode

        messagingTemplate.convertAndSend(
            "/topic/room/$roomCode",
            GameMessage(
                type = GameMessageType.GAME_START,
                roomCode = roomCode,
                data = mapOf("startTime" to System.currentTimeMillis())
            )
        )
    }

    // 유닛 소환
    @MessageMapping("/game.spawn")
    fun spawnUnit(@Payload message: GameMessage) {
        val roomCode = message.roomCode

        // 상대방에게 유닛 소환 알림
        messagingTemplate.convertAndSend(
            "/topic/room/$roomCode",
            GameMessage(
                type = GameMessageType.SPAWN_UNIT,
                roomCode = roomCode,
                playerId = message.playerId,
                data = message.data
            )
        )
    }

    // 유닛 상태 업데이트 (위치, HP 등)
    @MessageMapping("/game.update")
    fun updateUnit(@Payload message: GameMessage) {
        val roomCode = message.roomCode

        messagingTemplate.convertAndSend(
            "/topic/room/$roomCode",
            GameMessage(
                type = GameMessageType.UNIT_UPDATE,
                roomCode = roomCode,
                playerId = message.playerId,
                data = message.data
            )
        )
    }

    // 스킬 사용
    @MessageMapping("/game.skill")
    fun useSkill(@Payload message: GameMessage) {
        val roomCode = message.roomCode

        messagingTemplate.convertAndSend(
            "/topic/room/$roomCode",
            GameMessage(
                type = GameMessageType.USE_SKILL,
                roomCode = roomCode,
                playerId = message.playerId,
                data = message.data
            )
        )
    }

    // 기지 피해
    @MessageMapping("/game.baseDamage")
    fun baseDamage(@Payload message: GameMessage) {
        val roomCode = message.roomCode

        messagingTemplate.convertAndSend(
            "/topic/room/$roomCode",
            GameMessage(
                type = GameMessageType.BASE_DAMAGE,
                roomCode = roomCode,
                playerId = message.playerId,
                data = message.data
            )
        )
    }

    // 게임 종료
    @MessageMapping("/game.end")
    fun endGame(@Payload message: GameMessage) {
        val roomCode = message.roomCode

        messagingTemplate.convertAndSend(
            "/topic/room/$roomCode",
            GameMessage(
                type = GameMessageType.GAME_END,
                roomCode = roomCode,
                data = message.data
            )
        )
    }

    // 전체 상태 동기화 (주기적)
    @MessageMapping("/game.sync")
    fun syncState(@Payload message: GameMessage) {
        val roomCode = message.roomCode

        messagingTemplate.convertAndSend(
            "/topic/room/$roomCode",
            GameMessage(
                type = GameMessageType.SYNC_STATE,
                roomCode = roomCode,
                playerId = message.playerId,
                data = message.data
            )
        )
    }
}