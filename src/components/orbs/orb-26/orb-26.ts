import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb26Orb } from "@/components/orbs/orb-26/meta";

export { meta, orb26Orb } from "@/components/orbs/orb-26/meta";

@Component({
  selector: "orb-26",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb26 extends OrbBase {
  override readonly variant = orb26Orb;
}
