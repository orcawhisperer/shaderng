import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb29Orb } from "@/components/orbs/orb-29/meta";

export { meta, orb29Orb } from "@/components/orbs/orb-29/meta";

@Component({
  selector: "orb-29",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb29 extends OrbBase {
  override readonly variant = orb29Orb;
}
