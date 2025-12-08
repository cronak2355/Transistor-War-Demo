package com.transistorwar.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "game_records")
data class GameRecord(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    val room: GameRoom? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    val player: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opponent_id")
    val opponent: User? = null,  // null이면 AI 대전

    @Column(name = "player_faction", nullable = false, length = 10)
    val playerFaction: String,

    @Column(name = "opponent_faction", nullable = false, length = 10)
    val opponentFaction: String,

    @Column(name = "is_win", nullable = false)
    val isWin: Boolean,

    @Column(name = "is_ai_game", nullable = false)
    val isAiGame: Boolean = false,

    @Column(name = "game_duration_seconds")
    val gameDurationSeconds: Int? = null,

    @Column(name = "played_at", nullable = false)
    val playedAt: LocalDateTime = LocalDateTime.now()
)
