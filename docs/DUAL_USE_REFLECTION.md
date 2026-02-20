# Dual Use Reflection
**For Report Section 5 — Social, Ethical, Entrepreneurial Implications**
**Word count:** 178 words

---

The Robot Management System (RMS) was designed as a ground control station for safely monitoring and directing an autonomous robot. However, the same capabilities that make it useful also introduce dual use risks that must be acknowledged as part of responsible software engineering practice.

At its core, the RMS gives authenticated users the ability to remotely direct physical movement through a network-connected interface. If the system were deployed on a real robot rather than a simulator, an attacker who gained unauthorised Commander access could direct the robot into restricted or dangerous areas, use its onboard sensors for covert environmental mapping, or in an industrial context, cause physical damage or injury. The telemetry stream — which provides real-time position and sensor data — could similarly be exploited for surveillance purposes if intercepted.

To mitigate these risks, the system implements Role-Based Access Control, server-side session validation, Bcrypt password hashing, and a complete audit trail of every command issued. These are not optional features — they are ethical obligations. As the developer, I have a professional responsibility under LEPSI principles to consider how this software could be misused and to design against those scenarios from the outset, not as an afterthought.
