package com.transistorwar.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.transistorwar.entity.GameRecord
import com.transistorwar.entity.GameRoom
import com.transistorwar.entity.RoomStatus
import com.transistorwar.entity.User
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

// ===== Auth DTOs =====

data class SignUpRequest(
    @field:NotBlank(message = "아이디를 입력하세요")
    @field:Size(min = 3, max = 20, message = "아이디는 3~20자여야 합니다")
    val username: String,

    @field:NotBlank(message = "비밀번호를 입력하세요")
    @field:Size(min = 4, max = 100, message = "비밀번호는 4자 이상이어야 합니다")
    val password: String
)

data class LoginRequest(
    @field:NotBlank(message = "아이디를 입력하세요")
    val username: String,

    @field:NotBlank(message = "비밀번호를 입력하세요")
    val password: String
)

data class AuthResponse(
    val token: String,
    val user: UserResponse
)

// ===== User DTOs =====

data class UserResponse(
    val id: Long,
    val username: String,
    val totalGames: Int,
    val legacyWins: Int,
    val legacyLosses: Int,
    val modernWins: Int,
    val modernLosses: Int,
    val totalWins: Int,
    val totalLosses: Int,
    val winRate: Double,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(user: User) = UserResponse(
            id = user.id,
            username = user.username,
            totalGames = user.totalGames,
            legacyWins = user.legacyWins,
            legacyLosses = user.legacyLosses,
            modernWins = user.modernWins,
            modernLosses = user.modernLosses,
            totalWins = user.totalWins,
            totalLosses = user.totalLosses,
            winRate = user.winRate,
            createdAt = user.createdAt
        )
    }
}

// ===== Room DTOs =====

data class CreateRoomRequest(
    @field:NotBlank(message = "진영을 선택하세요")
    val faction: String  // "legacy" or "modern"
)

data class JoinRoomRequest(
    @field:NotBlank(message = "방 코드를 입력하세요")
    @JsonProperty("roomCode")
    val roomCode: String
)

data class RoomResponse(
    val id: Long,
    val roomCode: String,
    val hostId: Long,
    val hostName: String,
    val hostFaction: String,
    val guestId: Long?,
    val guestName: String?,
    val guestFaction: String?,
    val status: RoomStatus,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(room: GameRoom) = RoomResponse(
            id = room.id,
            roomCode = room.roomCode,
            hostId = room.host.id,
            hostName = room.host.username,
            hostFaction = room.hostFaction,
            guestId = room.guest?.id,
            guestName = room.guest?.username,
            guestFaction = room.guestFaction,
            status = room.status,
            createdAt = room.createdAt
        )
    }
}

// ===== Game DTOs =====

data class GameResultRequest(
    @field:NotBlank(message = "진영을 입력하세요")
    val faction: String,
    
    val isWin: Boolean,
    
    val isAiGame: Boolean = true,
    
    val gameDurationSeconds: Int? = null
)

data class GameRecordResponse(
    val id: Long,
    val playerFaction: String,
    val opponentFaction: String,
    val opponentName: String?,
    val isWin: Boolean,
    val isAiGame: Boolean,
    val gameDurationSeconds: Int?,
    val playedAt: LocalDateTime
) {
    companion object {
        fun from(record: GameRecord) = GameRecordResponse(
            id = record.id,
            playerFaction = record.playerFaction,
            opponentFaction = record.opponentFaction,
            opponentName = record.opponent?.username,
            isWin = record.isWin,
            isAiGame = record.isAiGame,
            gameDurationSeconds = record.gameDurationSeconds,
            playedAt = record.playedAt
        )
    }
}

// ===== Common DTOs =====

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null
) {
    companion object {
        fun <T> success(data: T, message: String? = null) = ApiResponse(
            success = true,
            message = message,
            data = data
        )

        fun <T> error(message: String) = ApiResponse<T>(
            success = false,
            message = message,
            data = null
        )
    }
}
