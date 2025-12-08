package com.transistorwar.entity

import jakarta.persistence.*
import java.time.LocalDateTime

enum class RoomStatus {
    WAITING,    // 대기중 (상대 기다리는 중)
    PLAYING,    // 게임 진행중
    FINISHED    // 게임 종료
}

@Entity
@Table(name = "game_rooms")
data class GameRoom(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "room_code", unique = true, nullable = false, length = 8)
    val roomCode: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    val host: User,

    @Column(name = "host_faction", nullable = false, length = 10)
    val hostFaction: String,  // "legacy" or "modern"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_id")
    var guest: User? = null,

    @Column(name = "guest_faction", length = 10)
    var guestFaction: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: RoomStatus = RoomStatus.WAITING,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "started_at")
    var startedAt: LocalDateTime? = null,

    @Column(name = "finished_at")
    var finishedAt: LocalDateTime? = null,

    @Column(name = "winner_id")
    var winnerId: Long? = null
) {
    // 게스트 참가
    fun join(guest: User) {
        this.guest = guest
        this.guestFaction = if (hostFaction == "legacy") "modern" else "legacy"
    }

    // 게임 시작
    fun start() {
        this.status = RoomStatus.PLAYING
        this.startedAt = LocalDateTime.now()
    }

    // 게임 종료
    fun finish(winnerId: Long) {
        this.status = RoomStatus.FINISHED
        this.finishedAt = LocalDateTime.now()
        this.winnerId = winnerId
    }

    // 방이 가득 찼는지 확인
    val isFull: Boolean
        get() = guest != null

    // 참가 가능한지 확인
    val canJoin: Boolean
        get() = status == RoomStatus.WAITING && !isFull
}
