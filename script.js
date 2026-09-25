/* ==========================================================================
       ১. কাউন্টডাউন টাইমার (COUNTDOWN TIMER CONFIGURATION)
       ========================================================================== */
    // নিচের পরিবর্তনযোগ্য তারিখটিতে আপনি যেকোনো কাঙ্ক্ষিত তারিখ ও সময় বসাতে পারেন:
    // Format: "YYYY-MM-DDTHH:MM:SS"
    // উদাহরণ: মহালয়া / দুর্গাপূজা ২০২৬
    const PUJA_TARGET_DATE = "2026-10-10T06:00:00"; 
    
    // টাইমার উপাদানগুলো নির্বাচন
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    const headlineTextEl = document.getElementById("countdownHeadlineText");

    function updateCountdown() {
      const targetTime = new Date(PUJA_TARGET_DATE).getTime();
      const currentTime = new Date().getTime();
      const difference = targetTime - currentTime;

      // যদি সময় পার হয়ে যায় বা শূন্যে পৌঁছায়
      if (difference <= 0) {
        headlineTextEl.textContent = "শুভ মহালয়া! মা এসেছেন!";
        daysEl.textContent = "০০";
        hoursEl.textContent = "০০";
        minutesEl.textContent = "০০";
        secondsEl.textContent = "০০";
        return;
      }

      // দিন, ঘণ্টা, মিনিট ও সেকেন্ড গণনা
      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      // সংখ্যা দুটি অঙ্কে প্রদর্শন (Leading zero)
      daysEl.textContent = d < 10 ? '0' + d : d;
      hoursEl.textContent = h < 10 ? '0' + h : h;
      minutesEl.textContent = m < 10 ? '0' + m : m;
      secondsEl.textContent = s < 10 ? '0' + s : s;
    }

    // প্রতি সেকেন্ডে কাউন্টডাউন হালনাগাদ
    updateCountdown();
    setInterval(updateCountdown, 1000);

    /* ==========================================================================
       ২. অডিও প্লেয়ার নিয়ন্ত্রণ এবং একক গান প্লে নিশ্চিতকরণ
       ========================================================================== */
    const allAudioElements = document.querySelectorAll(".agomoni-audio");

    // যখন কোনো একটি অডিও চলবে, বাকি সব অডিও স্বয়ংক্রিয়ভাবে থেমে যাবে
    allAudioElements.forEach(audio => {
      audio.addEventListener("play", function() {
        allAudioElements.forEach(otherAudio => {
          if (otherAudio !== audio && !otherAudio.paused) {
            otherAudio.pause();
          }
        });
      });
    });

    // ওয়েব অডিও এপিআই সিন্থেসাইজার (যদি কোনো লোকাল MP3 ফাইল না থাকে)
    let audioCtx = null;
    function getAudioContext() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    // কাস্টম প্লে এবং পজ বাটন লজিক
    function handleSongControl(songId, action) {
      const audio = document.getElementById("audio" + songId);
      if (!audio) return;

      if (action === 'play') {
        // অন্যান্য সকল অডিও পজ করা
        allAudioElements.forEach(other => {
          if (other !== audio) other.pause();
        });

        // অডিও ফাইল লোড করার চেষ্টা
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // যদি লোকাল MP3 ফাইল না পাওয়া যায়, তবে ব্রাউজার সিন্থেসাইজারে আগমনী তানপুরা সুর বাজবে
            console.log("স্থানীয় mp3 ফাইল পাওয়া যায়নি, সুরেলা তানপুরা সুর বাজানো হচ্ছে:", error);
            playMelodicTone(songId);
          });
        }
      } else if (action === 'pause') {
        audio.pause();
      }
    }

    // সুন্দর মেলোডি জেনারেটর (আবাহনী সুর)
    function playMelodicTone(index) {
      try {
        const ctx = getAudioContext();
        const baseFreqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
        const freq = baseFreqs[(index - 1) % baseFreqs.length];

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 1.2);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.8);
      } catch (err) {
        console.error("Audio Context Error:", err);
      }
    }

    /* ==========================================================================
       ৩. ভার্চুয়াল ঢাক ও কাঁসর ঘণ্টার সুর (WEB AUDIO SYNTHESIS)
       ========================================================================== */
    let dhakInterval = null;
    const dhakTrigger = document.getElementById("dhakTrigger");
    const dhakStatusText = document.getElementById("dhakStatusText");

    // একক ঢাকের আঘাতের শব্দ সৃষ্টি
    function playDhakHit(type = "dha") {
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === "dha") {
          // গম্ভীর ভারী ঢাকের ধ্বনি
          osc.type = "triangle";
          osc.frequency.setValueAtTime(140, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.28);
          gain.gain.setValueAtTime(0.9, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        } else if (type === "ting") {
          // কাঠি দিয়ে চটি বা কড়া আঘাত
          osc.type = "sine";
          osc.frequency.setValueAtTime(420, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(210, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        } else if (type === "kashor") {
          // ঘণ্টার ধাতব সুমিষ্ট ধ্বনি
          osc.type = "sine";
          osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 নোট
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.9);

        // ভিজুয়াল ঢাক কাঁপুনি অ্যানিমেশন
        if (dhakTrigger) {
          dhakTrigger.classList.add("beating");
          setTimeout(() => dhakTrigger.classList.remove("beating"), 140);
        }
      } catch (e) {
        console.error("Dhak synthesis failed:", e);
      }
    }

   
    // ঢাকে সরাসরি ক্লিকে বাড়ি
    if (dhakTrigger) {
      dhakTrigger.addEventListener("click", () => {
        playDhakHit("dha");
        dhakStatusText.textContent = "ঢাং! ঢাকে জোরসে বাড়ি পড়েছে!";
      });
    }

    /* ==========================================================================
       ৪. মোবাইল নেভিগেশন ও স্ক্রল টু টপ
       ========================================================================== */
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    const backToTopBtn = document.getElementById("backToTop");

    // মোবাইল মেনু টগল
    if (menuToggle && navLinks) {
      menuToggle.addEventListener("click", () => {
        menuToggle.classList.toggle("open");
        navLinks.classList.toggle("active");
      });

      // মেনুর কোনো লিংকে ক্লিক করলে মেনু নিজে থেকেই বন্ধ হবে
      navLinks.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
          menuToggle.classList.remove("open");
          navLinks.classList.remove("active");
        });
      });
    }

    // স্ক্রল ওপর বাটনের দৃশ্যমানতা
    window.addEventListener("scroll", () => {
      if (window.scrollY > 380) {
        backToTopBtn.classList.add("visible");
      } else {
        backToTopBtn.classList.remove("visible");
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });


    // __________________________________________________________________________
    const realDhakSounds = {
    "dha-kuting": "audio/Durga Puja Dhak Music 2025  Traditional Dhol Beats of Durga Puja Festival  Navratri Special🙏🎧.mp3",
    "arati": "audio/Dhak music,বাংলার দূর্গা পূজোর ঢাক আরতিDurgapuja Arti Dhaker Bajna.mp3",
    "kashor": "audio/kasor ghonta.mp3",
    "bhashan": "audio/bochor bochor song.mp3"
};

let currentDhakAudio = null;

function playRealDhak(type) {
    if (currentDhakAudio) {
        currentDhakAudio.pause();
        currentDhakAudio.currentTime = 0;
    }

    currentDhakAudio = new Audio(realDhakSounds[type]);
    currentDhakAudio.volume = 1.0;

    currentDhakAudio.play();

    document.getElementById("dhakStatusText").textContent =
        "🥁 ঢাকের আসল শব্দ বাজছে...";
}

function stopRealDhak() {
    if (currentDhakAudio) {
        currentDhakAudio.pause();
        currentDhakAudio.currentTime = 0;
        currentDhakAudio = null;
    }

    document.getElementById("dhakStatusText").textContent =
        "⏹️ ঢাকের শব্দ বন্ধ করা হয়েছে।";
}

/* =====================================
   DURGA LOADING SCREEN
===================================== */

window.addEventListener("load", function () {

    const loader = document.getElementById("durga-loader");
    const progressBar = document.getElementById("loader-progress-bar");
    const percentText = document.getElementById("loader-percent");
    const message = document.getElementById("loader-message");

    const messages = [
        "মা আসছেন...",
        "শিউলির গন্ধে শরৎ জাগছে...",
        "ঢাকের বাদ্য বেজে উঠছে...",
        "মায়ের আগমনী...",
        "শুভ দেবীপক্ষ!"
    ];

    let progress = 0;

    const interval = setInterval(() => {

        progress += Math.floor(Math.random() * 6) + 2;

        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }

        progressBar.style.width = progress + "%";
        percentText.textContent = progress + "%";

        const messageIndex = Math.min(
            Math.floor(progress / 20),
            messages.length - 1
        );

        message.textContent = messages[messageIndex];

    }, 100);


    // Minimum display time
    setTimeout(() => {

        progress = 100;

        progressBar.style.width = "100%";
        percentText.textContent = "100%";
        // message.textContent = "শুভ মহালয়া! 🌺";

        setTimeout(() => {

            loader.classList.add("loader-hidden");

            setTimeout(() => {
                loader.remove();
            }, 1000);

        }, 700);

    }, 3500);

});

    /* ==========================================================================
       ৫. ভাসমান কাশফুল ও পাপড়ির অ্যানিমেশন (CANVAS PARTICLE SYSTEM)
       ========================================================================== */
    const canvas = document.getElementById("kashCanvas");
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 35; // হালকা ও মসৃণ পারফরম্যান্সের জন্য

    class KashPetal {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.size = Math.random() * 8 + 6;
        this.speedY = Math.random() * 1.2 + 0.6;
        this.speedX = Math.random() * 1 - 0.5;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 1.5;
        this.opacity = Math.random() * 0.5 + 0.3;
        // কাশফুল সাদা বা হালকা শিউলি পাপড়ির রঙ
        this.color = Math.random() > 0.3 ? "255, 255, 255" : "255, 235, 180";
      }

      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * 0.01) * 0.8 + this.speedX;
        this.rotation += this.rotationSpeed;

        if (this.y > height + 20) {
          this.reset();
          this.y = -10;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.beginPath();
        // কাশফুলের নরম পাপড়ির আকার
        ctx.ellipse(0, 0, this.size * 0.45, this.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new KashPetal());
    }

    function animateKash() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateKash);
    }

    animateKash();