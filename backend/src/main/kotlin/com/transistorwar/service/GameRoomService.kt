package com.transistorwar.service

import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap

@Service
class GameRoomService {

    // 활성 게임 방 (roomCode -> 게임 상태)
    private val activeGames = ConcurrentHashMap<String, GameState>()

    data class GameState(
        val roomCode: String,
        var hostId: Long,
        var guestId: Long? = null,
        var hostFaction: String,
        var guestFaction: String? = null,
        var legacyBaseHp: Int = 100,
        var modernBaseHp: Int = 100,
        var isStarted: Boolean = false
    )

    fun createGame(roomCode: String, hostId: Long, hostFaction: String): GameState {
        val state = GameState(
            roomCode = roomCode,
            hostId = hostId,
            hostFaction = hostFaction,
            guestFaction = if (hostFaction == "legacy") "modern" else "legacy"
        )
        activeGames[roomCode] = state
        return state
    }

    fun joinGame(roomCode: String, guestId: Long): GameState? {
        val state = activeGames[roomCode] ?: return null
        state.guestId = guestId
        return state
    }

    fun getGame(roomCode: String): GameState? = activeGames[roomCode]

    fun removeGame(roomCode: String) {
        activeGames.remove(roomCode)
    }

    fun updateBaseHp(roomCode: String, faction: String, damage: Int): GameState? {
        val state = activeGames[roomCode] ?: return null
        if (faction == "legacy") {
            state.legacyBaseHp -= damage
        } else {
            state.modernBaseHp -= damage
        }
        return state
    }
}