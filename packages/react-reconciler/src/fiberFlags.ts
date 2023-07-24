export type Flags = number;

export const NoFlags = 0b000000000000;
export const Placement = 0b000000000001;
export const Update = 0b000000000010;
export const ChildDeletion = 0b000000000100;


export const PassiveEffect = 0b000000001000; // 需要处理副作用
export const Ref = 0b000000010000;

export const LayoutMask = Ref;

export const MutationMask = Placement | Update | ChildDeletion | Ref;

export const PassiveMask = PassiveEffect | ChildDeletion;
