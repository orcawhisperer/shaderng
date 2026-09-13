import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb19Orb } from "@/components/orbs/orb-19/meta";

export { meta, orb19Orb } from "@/components/orbs/orb-19/meta";

@Component({
  selector: "orb-19",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb19 extends OrbBase {
  override readonly variant = orb19Orb;
}
