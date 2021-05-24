


/* These next few consts are copied from DefaultSimulcastUplinkPolicy.ts -
 TODO: We need to import it from their instead */
export const enum ActiveStreams {
  kHi,
  kHiAndLow,
  kMidAndLow,
  kLow,
}



/*
	Per Chime defaults, bitrates are in KILOBITS per second, not bits.
*/
export default class BandwidthPolicyRule {
	numberParticipants:number; 
	bitrate:number;
	lowStreamBitrate:number;
	mediumStreamBitrate:number;
	highStreamBitrate:number;

	rule_number:number = -1

	// a rule of 'MAX' is usually the last policy entry for a given number of participants. 
	// Allows us to catch any arbitrarily high bandwidth and catch that and handle. Without
	// it, we'd possibly drop off the end of the list without matching if there were high
	// numbers pf participants/bandwidth involved.
	static BITRATE_MAX     = Number.MAX_SAFE_INTEGER;
	static PARTICIPANT_MAX = Number.MAX_SAFE_INTEGER
	// Current rough estimates where webrtc disables streams
	static kHiDisabledRate = 700;
	static kMidDisabledRate = 240;

	constructor( numberParticipants:number, bitrate:number, lowStreamBitrate:number, mediumStreamBitrate:number, highStreamBitrate:number )
	{
		this.numberParticipants   = numberParticipants;
		this.bitrate              = bitrate;
		this.lowStreamBitrate     = lowStreamBitrate;
		this.mediumStreamBitrate  = mediumStreamBitrate;
		this.highStreamBitrate    = highStreamBitrate;
	}

	/* check if this policy is a match for the number of participants and bitrate.
	It is considered a match if all the following conditions apply:
		1. the number of participants given is LESS THAN OR EQUAL to the number of
		 participants defined in this policy
		2. The bitrate given is GREATER THAN OR EQUAL TO the bitrate defined in the policy
	These two facts combined allow us to construct bandwidth policies as a list that
	goes from smallest numbers of participants and worst case bandwidth up.
	*/
	Match ( numberParticipants:number, bitrate:number )
	{
		if ( numberParticipants <= this.numberParticipants && bitrate <= this.bitrate)
			return true;
	}

	ActiveStreams () {
		// Amazon only supports a few permutations of the 3 streams active, and never more than 2.
		switch (true) {
			case ( this.lowStreamBitrate !== 0 && this.highStreamBitrate !== 0):
				return ActiveStreams.kHiAndLow;
			case (this.lowStreamBitrate !== 0 && this.mediumStreamBitrate !== 0):
				return ActiveStreams.kMidAndLow;
			case (this.lowStreamBitrate !== 0):
				return ActiveStreams.kLow
			case (this.highStreamBitrate !== 0):
				return ActiveStreams.kHi
		}
	}

	toString() {
		return `Rule ${this.rule_number}: ` + this.numberParticipants + " / " + this.bitrate + ` = \t ${this.ActiveStreams()} (` + this.lowStreamBitrate+ "," + this.mediumStreamBitrate + "," + this.highStreamBitrate +")" 
	}

};