// The bridge's ring replayed to an attaching watchdog (graph @nks/nks-dev, node #5671):
// the bridge puts the hello of each socket reopening into the ring and names the ring's
// frame count in `attached` (buffered). The attach line waits for those frames and counts
// only the printed ones; the ring's hello is one, the last.

export class RingReplay {
  /** How many ring frames were printed as lines for the doer. */
  printed = 0;
  /** The ring's last hello, as a raw line. */
  hello = "";
  private left = 0;
  private release: (() => void) | null = null;

  /** A new attach: the attach-line gate opens when the ring is delivered or the time is up. */
  start(buffered: number, waitMs: number): Promise<void> {
    this.end();
    this.left = buffered;
    this.printed = 0;
    this.hello = "";
    let done = (): void => {};
    const ready = new Promise<void>((r) => (done = r));
    this.release = done;
    // Not unref'd: the output queue waits on this gate, and the process must not end silently behind it.
    setTimeout(() => this.release === done && this.end(), waitMs);
    return ready;
  }

  /** A frame came: true if it is from the ring. */
  next(): boolean {
    if (this.left <= 0) return false;
    this.left--;
    return true;
  }

  /** An event is handled: once the ring is delivered, the gate opens. */
  settle(): void {
    if (this.release && this.left === 0) this.end();
  }

  /** Stop waiting for ring frames: the watchdog's last word does not stand behind the gate. */
  end(): void {
    this.left = 0;
    this.release?.();
    this.release = null;
  }
}
