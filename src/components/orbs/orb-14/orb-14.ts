import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb14Orb } from "@/components/orbs/orb-14/meta";

export { meta, orb14Orb } from "@/components/orbs/orb-14/meta";

@Component({
  selector: "orb-14",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb14 extends OrbBase {
  override readonly variant = orb14Orb;
}
