import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb27Orb } from "@/components/orbs/orb-27/meta";

export { meta, orb27Orb } from "@/components/orbs/orb-27/meta";

@Component({
  selector: "orb-27",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb27 extends OrbBase {
  override readonly variant = orb27Orb;
}
