import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb28Orb } from "@/components/orbs/orb-28/meta";

export { meta, orb28Orb } from "@/components/orbs/orb-28/meta";

@Component({
  selector: "orb-28",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb28 extends OrbBase {
  override readonly variant = orb28Orb;
}
