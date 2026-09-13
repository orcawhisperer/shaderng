import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb25Orb } from "@/components/orbs/orb-25/meta";

export { meta, orb25Orb } from "@/components/orbs/orb-25/meta";

@Component({
  selector: "orb-25",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb25 extends OrbBase {
  override readonly variant = orb25Orb;
}
