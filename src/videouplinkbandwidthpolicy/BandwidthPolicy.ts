import BandwidthPolicyRule from './BandwidthPolicyRule';

/*
	This allows a client app to customise the way Chime simulcast tunes the three simulcast streams by
	using a table that indexes number of users vs uplink bandwidth and selects an appropriate low, medium
	and high quality stream bitrate.

	This replaces the hardcoded if/then/else block in the chime default simulcast uplink policy.
	It can also be changes on the fly.

	A sample default policy that roughly replicates the old chime if/else block is given below as 
	ChimeDefaultPolicy()

	A bandwidth policy is a list that is processed from the start, one rule at a time, till a match
	is found.
	A match is identified with the number of senders in the meeting is less than or equal to the number
	of senders in the rule, and the uplink bitrate is less than or equal the number defined in the rule.

	Then the rule has 3 values that is the bitrate for each of the simulcast streams: low, medium and high.
	A bitrate of 0 means that stream is disabled.

	Example:
		BandwidthPolicyRule(4, 800, 150, 600, 0);

		This rule matches any conference where there are 4 or less senders, the uplink bandwidth is only 800kbs
		or less; and tells us to send two streams: A  low quality stream at 150kbs, and a medium stream at 600kbs
*/

export default class BandwidthPolicy {
	rules:Array<BandwidthPolicyRule> = []

	constructor(rules:Array<BandwidthPolicyRule>) {
		this.rules = rules
	}


	FindPolicyMatch(number_participants:number, uplinkBitrate:number)
	{
		let rule_num = 0;
		for (let rule of this.rules) {
			rule.rule_number = rule_num++;	// Sneak in an ordered rule number to make debug easier later.
			if (rule.Match(number_participants, uplinkBitrate))
			{
				console.log("BANDWIDTH POLICY MATCH: Tested with " + number_participants + " participants with bitrate of " + uplinkBitrate + " and got a result: \t" + rule )
				return rule
			}
		}	
		// Policy not found. This shouldn't ever happen. Return a default low quality policy
		return new BandwidthPolicyRule(99, 99, 100, 0, 0);
	}


	TestPolicy( number_participants:number, uplinkBitrate:number)
	{
		let rule = this.FindPolicyMatch(number_participants, uplinkBitrate)

		console.log("Tested with " + number_participants + " participants with bitrate of " + uplinkBitrate + " and got a result: \t" + rule )
	}


	// The chime default stream, converted from 'if then else' codeblock in to this
	// data structure. Has some flaws in that the fallthrough final option is 300kbs min.
	// This is not a perfect match, as the chime version here will do things like check 
	// numParticipants in one place, and numSenders in the next. We only use numSenders
	/*
	      if (this.numParticipants >= 0 && this.numParticipants <= 2) {
	        // Simulcast disabled
	        this.newActiveStreams = ActiveStreams.kHi;
	        newBitrates[0].maxBitrateKbps = 0;
	        newBitrates[1].maxBitrateKbps = 0;
	        newBitrates[2].maxBitrateKbps = 1200;
	      } else if (
	        this.numSenders <= 4 &&
	        this.lastUplinkBandwidthKbps >= DefaultSimulcastUplinkPolicy.kHiDisabledRate
	      ) {
	        // 320x192+ (640x384)  + 1280x768
	        this.newActiveStreams = ActiveStreams.kHiAndLow;
	        newBitrates[0].maxBitrateKbps = 300;
	        newBitrates[1].maxBitrateKbps = 0;
	        newBitrates[2].maxBitrateKbps = 1200;
	      } else if (this.lastUplinkBandwidthKbps >= DefaultSimulcastUplinkPolicy.kMidDisabledRate) {
	        // 320x192 + 640x384 + (1280x768)
	        this.newActiveStreams = ActiveStreams.kMidAndLow;
	        newBitrates[0].maxBitrateKbps = this.lastUplinkBandwidthKbps >= 350 ? 200 : 150;
	        newBitrates[1].maxBitrateKbps = this.numSenders <= 6 ? 600 : 350;
	        newBitrates[2].maxBitrateKbps = 0;
	      } else {
	        // 320x192 + 640x384 + (1280x768)
	        this.newActiveStreams = ActiveStreams.kLow;
	        newBitrates[0].maxBitrateKbps = 300;
	        newBitrates[1].maxBitrateKbps = 0;
	        newBitrates[2].maxBitrateKbps = 0;
	      }
	*/
	static ChimeDefaultPolicy(){
		return new BandwidthPolicy([
			new BandwidthPolicyRule( 2, 						            BandwidthPolicyRule.BITRATE_MAX,	   	 0,     0, 1200 ),

			new BandwidthPolicyRule( 4, 						  			BandwidthPolicyRule.kMidDisabledRate,	 300,   0,    0 ),
			new BandwidthPolicyRule( 4, 						               								 350,	 150, 600,    0 ),
			new BandwidthPolicyRule( 4, 						   			BandwidthPolicyRule.kHiDisabledRate,	 200, 600,    0 ),
			new BandwidthPolicyRule( 4, 									BandwidthPolicyRule.BITRATE_MAX,	 	 300,   0, 1200 ),

			new BandwidthPolicyRule( 6, 						  			BandwidthPolicyRule.kMidDisabledRate,	 300,   0,    0 ),
			new BandwidthPolicyRule( 6, 						               								 350,	 150, 600,    0 ),
			new BandwidthPolicyRule( 6, 									BandwidthPolicyRule.BITRATE_MAX,	 	 200, 600,    0 ),

			new BandwidthPolicyRule( BandwidthPolicyRule.PARTICIPANT_MAX, 	BandwidthPolicyRule.kMidDisabledRate,	 300,   0,    0 ),
			new BandwidthPolicyRule( BandwidthPolicyRule.PARTICIPANT_MAX, 									 350,	 150, 350,    0 ),

			new BandwidthPolicyRule( BandwidthPolicyRule.PARTICIPANT_MAX,   BandwidthPolicyRule.BITRATE_MAX,	 	 200, 600,    0 )
		])
	}

}
