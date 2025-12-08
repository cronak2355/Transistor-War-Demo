package com.transistorwar.repository

import com.transistorwar.entity.GameRecord
import com.transistorwar.entity.GameRoom
import com.transistorwar.entity.RoomStatus
import com.transistorwar.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByUsername(username: String): Optional<User>
    fun existsByUsername(username: String): Boolean
    
    // 랭킹 (승률 기준)
    @Query("SELECT u FROM User u WHERE u.totalGames >= :minGames ORDER BY (u.legacyWins + u.modernWins) * 1.0 / u.totalGames DESC")
    fun findTopByWinRate(minGames: Int = 5): List<User>
    
    // 랭킹 (총 승리 수 기준)
    @Query("SELECT u FROM User u ORDER BY (u.legacyWins + u.modernWins) DESC")
    fun findTopByTotalWins(): List<User>
}

@Repository
interface GameRoomRepository : JpaRepository<GameRoom, Long> {
    fun findByRoomCode(roomCode: String): Optional<GameRoom>
    fun findByStatus(status: RoomStatus): List<GameRoom>
    fun findByStatusIn(statuses: List<RoomStatus>): List<GameRoom>
    
    // 대기중인 방 목록
    @Query("SELECT r FROM GameRoom r WHERE r.status = 'WAITING' ORDER BY r.createdAt DESC")
    fun findWaitingRooms(): List<GameRoom>
    
    // 활성 방 (대기 + 진행중)
    @Query("SELECT r FROM GameRoom r WHERE r.status IN ('WAITING', 'PLAYING') ORDER BY r.createdAt DESC")
    fun findActiveRooms(): List<GameRoom>
    
    // 사용자가 호스트거나 게스트인 방
    @Query("SELECT r FROM GameRoom r WHERE (r.host.id = :userId OR r.guest.id = :userId) AND r.status IN ('WAITING', 'PLAYING')")
    fun findByUserInRoom(userId: Long): Optional<GameRoom>
}

@Repository
interface GameRecordRepository : JpaRepository<GameRecord, Long> {
    fun findByPlayerIdOrderByPlayedAtDesc(playerId: Long): List<GameRecord>
    
    // 최근 N개 게임 기록
    @Query("SELECT r FROM GameRecord r WHERE r.player.id = :playerId ORDER BY r.playedAt DESC")
    fun findRecentByPlayerId(playerId: Long): List<GameRecord>
    
    // AI 게임 기록
    fun findByPlayerIdAndIsAiGameTrueOrderByPlayedAtDesc(playerId: Long): List<GameRecord>
    
    // PvP 게임 기록
    fun findByPlayerIdAndIsAiGameFalseOrderByPlayedAtDesc(playerId: Long): List<GameRecord>
}
