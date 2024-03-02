import { RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";

class PeerService {
  constructor() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
    }
  }

  async getAnswer(offer) {
    if (this.peer) {
      await this.peer
        .setRemoteDescription(offer)
        .catch((err) => console.log(err));
      const ans = await this.peer.createAnswer();
      await this.peer
        .setLocalDescription(new RTCSessionDescription(ans))
        .catch((err) => console.log(err));
      return ans;
    }
  }

  async setLocalDescription(ans) {
    if (
      this.peer &&
      this.peer.signalingState != "stable" &&
      this.peer.signalingState != "have-remote-offer"
    ) {
      await this.peer
        .setRemoteDescription(new RTCSessionDescription(ans))
        .catch((err) => console.log(err));
    }
  }

  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer
        .setLocalDescription(new RTCSessionDescription(offer))
        .catch((err) => console.log(err));
      return offer;
    }
  }
}

export default PeerService;
