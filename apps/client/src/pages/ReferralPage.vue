<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEconomyStore } from '@/stores/economy';
import { useTelegram } from '@/composables/useTelegram';

const router = useRouter();
const economyStore = useEconomyStore();
const { user } = useTelegram();
const tg = window.Telegram?.WebApp;

const referralCode = computed(() => `ref_${user.value?.id ?? '000000'}`);
const referralLink = computed(() => `https://t.me/CastleBlastBot?start=${referralCode.value}`);
const totalReferred = ref(0);
const copied = ref(false);

const rewards = ref([
  { threshold: 1, reward: '1 Star', icon: '⭐', claimed: false },
  { threshold: 3, reward: '500 Coins', icon: '🪙', claimed: false },
  { threshold: 5, reward: '3 Rockets + 3 Bombs', icon: '🚀', claimed: false },
  { threshold: 10, reward: '3-day Premium', icon: '👑', claimed: false },
]);

const nextReward = computed(() => rewards.value.find(r => !r.claimed && totalReferred.value >= r.threshold));

function goBack() {
  router.push({ name: 'home' });
}

onMounted(() => {
  tg?.BackButton.show();
  tg?.BackButton.onClick(goBack);
});

onUnmounted(() => {
  tg?.BackButton.hide();
  tg?.BackButton.offClick(goBack);
});

function copyLink() {
  navigator.clipboard.writeText(referralLink.value).then(() => {
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  });
}

function shareLink() {
  const text = `Play Castle Blast with me! 🏰💥 Use my invite link:`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink.value)}&text=${encodeURIComponent(text)}`;
  window.open(shareUrl, '_blank');
}

function claimReward(threshold: number) {
  const r = rewards.value.find(r => r.threshold === threshold);
  if (r && !r.claimed && totalReferred.value >= threshold) {
    r.claimed = true;
    // TODO: call API
  }
}
</script>

<template>
  <div class="referral">
    <header class="referral__header">
      <button class="referral__back" @click="goBack">←</button>
      <h2>Invite Friends</h2>
    </header>

    <!-- Hero -->
    <div class="referral__hero">
      <div class="referral__hero-icon">🎁</div>
      <h3>Invite & Earn Rewards!</h3>
      <p>Share your link and earn rewards when friends join and play</p>
    </div>

    <!-- Stats -->
    <div class="referral__stats">
      <div class="referral__stat-box">
        <span class="referral__stat-value">{{ totalReferred }}</span>
        <span class="referral__stat-label">Friends Invited</span>
      </div>
    </div>

    <!-- Share Actions -->
    <div class="referral__share">
      <div class="referral__link-box">
        <span class="referral__link-text">{{ referralLink }}</span>
      </div>
      <div class="referral__share-buttons">
        <button class="referral__btn referral__btn--copy" @click="copyLink">
          {{ copied ? 'Copied!' : 'Copy Link' }}
        </button>
        <button class="referral__btn referral__btn--share" @click="shareLink">
          Share via Telegram
        </button>
      </div>
    </div>

    <!-- Reward Milestones -->
    <div class="referral__rewards">
      <h4>Reward Milestones</h4>
      <div
        v-for="r in rewards"
        :key="r.threshold"
        class="referral__reward"
        :class="{
          'referral__reward--available': totalReferred >= r.threshold && !r.claimed,
          'referral__reward--claimed': r.claimed,
          'referral__reward--locked': totalReferred < r.threshold,
        }"
      >
        <div class="referral__reward-icon">{{ r.icon }}</div>
        <div class="referral__reward-info">
          <span class="referral__reward-name">{{ r.reward }}</span>
          <span class="referral__reward-req">{{ r.threshold }} friend{{ r.threshold > 1 ? 's' : '' }}</span>
        </div>
        <div class="referral__reward-progress">
          <span>{{ Math.min(totalReferred, r.threshold) }}/{{ r.threshold }}</span>
        </div>
        <button
          v-if="totalReferred >= r.threshold && !r.claimed"
          class="referral__claim-btn"
          @click="claimReward(r.threshold)"
        >
          Claim
        </button>
        <span v-else-if="r.claimed" class="referral__claimed-badge">✓</span>
        <span v-else class="referral__locked-badge">🔒</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.referral {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  overflow-y: auto;
}

.referral__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #16213e;
}

.referral__back {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}

.referral__header h2 {
  font-size: 20px;
}

.referral__hero {
  text-align: center;
  padding: 24px 16px 16px;
}

.referral__hero-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.referral__hero h3 {
  font-size: 20px;
  margin-bottom: 4px;
}

.referral__hero p {
  font-size: 13px;
  opacity: 0.6;
}

.referral__stats {
  display: flex;
  justify-content: center;
  padding: 0 16px 16px;
}

.referral__stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 32px;
  background: #22264a;
  border-radius: 14px;
}

.referral__stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #ffd700;
}

.referral__stat-label {
  font-size: 12px;
  opacity: 0.6;
}

.referral__share {
  padding: 0 16px 16px;
}

.referral__link-box {
  padding: 12px;
  background: #22264a;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}

.referral__link-text {
  font-size: 12px;
  opacity: 0.7;
  word-break: break-all;
}

.referral__share-buttons {
  display: flex;
  gap: 10px;
}

.referral__btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.referral__btn--copy {
  background: #333;
  color: #fff;
}

.referral__btn--share {
  background: linear-gradient(135deg, #0088cc, #0066aa);
  color: #fff;
}

.referral__rewards {
  padding: 0 16px 24px;
}

.referral__rewards h4 {
  font-size: 16px;
  margin-bottom: 10px;
  opacity: 0.8;
}

.referral__reward {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #22264a;
  border-radius: 12px;
  margin-bottom: 8px;
}

.referral__reward--claimed {
  opacity: 0.5;
}

.referral__reward--locked {
  opacity: 0.6;
}

.referral__reward--available {
  border: 1px solid #ffd700;
}

.referral__reward-icon {
  font-size: 24px;
  width: 36px;
  text-align: center;
}

.referral__reward-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.referral__reward-name {
  font-weight: 700;
  font-size: 14px;
}

.referral__reward-req {
  font-size: 11px;
  opacity: 0.5;
}

.referral__reward-progress {
  font-size: 12px;
  opacity: 0.6;
  min-width: 30px;
  text-align: center;
}

.referral__claim-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a1a2e;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

.referral__claimed-badge {
  color: #2ecc71;
  font-size: 18px;
  font-weight: 700;
}

.referral__locked-badge {
  font-size: 16px;
}
</style>
