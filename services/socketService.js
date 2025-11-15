/**
 * Socket Service
 * Handles real-time events and notifications via Socket.IO
 */

class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.IO instance
   * @param {Server} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io;
  }

  /**
   * Emit event to specific room
   * @param {string} room - Room name/ID
   * @param {string} event - Event name
   * @param {any} data - Data to send
   */
  emitToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
      console.log(`Emitted ${event} to room ${room}`);
    }
  }

  /**
   * Emit event to all connected clients
   * @param {string} event - Event name
   * @param {any} data - Data to send
   */
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`Emitted ${event} to all clients`);
    }
  }

  /**
   * Emit new announcement notification
   * @param {object} announcement - Announcement data
   */
  notifyNewAnnouncement(announcement) {
    this.emitToAll('new-announcement', announcement);
  }

  /**
   * Emit attendance update
   * @param {string} teacherId - Teacher ID
   * @param {object} attendanceData - Attendance data
   */
  notifyAttendanceUpdate(teacherId, attendanceData) {
    this.emitToRoom(`teacher-${teacherId}`, 'attendance-update', attendanceData);
  }

  /**
   * Emit student attendance update
   * @param {string} studentId - Student ID
   * @param {object} attendanceData - Attendance data
   */
  notifyStudentAttendance(studentId, attendanceData) {
    this.emitToRoom(`student-${studentId}`, 'student-attendance', attendanceData);
  }

  /**
   * Emit lesson record update
   * @param {string} studentId - Student ID
   * @param {object} recordData - Lesson record data
   */
  notifyLessonRecord(studentId, recordData) {
    this.emitToRoom(`student-${studentId}`, 'lesson-record', recordData);
  }

  /**
   * Emit assignment notification
   * @param {string} studentId - Student ID
   * @param {object} assignmentData - Assignment data
   */
  notifyNewAssignment(studentId, assignmentData) {
    this.emitToRoom(`student-${studentId}`, 'new-assignment', assignmentData);
  }

  /**
   * Emit reschedule request notification
   * @param {string} targetId - Target user ID (admin or teacher)
   * @param {string} targetRole - Target role (admin or teacher)
   * @param {object} rescheduleData - Reschedule request data
   */
  notifyRescheduleRequest(targetId, targetRole, rescheduleData) {
    this.emitToRoom(`${targetRole}-${targetId}`, 'reschedule-request', rescheduleData);
  }

  /**
   * Emit module update notification
   * @param {object} moduleData - Module data
   */
  notifyModuleUpdate(moduleData) {
    this.emitToAll('module-update', moduleData);
  }

  /**
   * Notify admin about new registrations
   * @param {string} type - Registration type (teacher or student)
   * @param {object} data - Registration data
   */
  notifyAdminNewRegistration(type, data) {
    this.emitToRoom('admin', `new-${type}-registration`, data);
  }

  /**
   * Force logout user when account is blocked/deleted
   * @param {string} userId - User ID
   * @param {string} userRole - User role (teacher or student)
   * @param {string} reason - Reason for logout
   */
  forceLogoutUser(userId, userRole, reason = 'Akun Anda telah dinonaktifkan oleh administrator') {
    this.emitToRoom(`${userRole}-${userId}`, 'force-logout', {
      reason: reason,
      timestamp: new Date()
    });
    console.log(`Force logout sent to ${userRole}-${userId}`);
  }
}

// Export singleton instance
module.exports = new SocketService();
