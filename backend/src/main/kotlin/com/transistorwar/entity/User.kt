package com.transistorwar.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(unique = true, nullable = false, length = 50)
    val username: String,

    @Column(nullable = false)
    val password: String,

    @Column(name = "total_games", nullable = false)
    var totalGames: Int = 0,

    @Column(name = "legacy_wins", nullable = false)
    var legacyWins: Int = 0,

    @Column(name = "legacy_losses", nullable = false)
    var legacyLosses: Int = 0,

    @Column(name = "modern_wins", nullable = false)
    var modernWins: Int = 0,

    @Column(name = "modern_losses", nullable = false)
    var modernLosses: Int = 0,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "last_login_at")
    var lastLoginAt: LocalDateTime? = null
) {
    // 전체 승리 수
    val totalWins: Int
        get() = legacyWins + modernWins

    // 전체 패배 수
    val totalLosses: Int
        get() = legacyLosses + modernLosses

    // 승률 계산
    val winRate: Double
        get() = if (totalGames > 0) (totalWins.toDouble() / totalGames) * 100 else 0.0

    // 게임 결과 기록
    fun recordGame(faction: String, isWin: Boolean) {
        totalGames++
        when {
            faction == "legacy" && isWin -> legacyWins++
            faction == "legacy" && !isWin -> legacyLosses++
            faction == "modern" && isWin -> modernWins++
            faction == "modern" && !isWin -> modernLosses++
        }
    }
}
