export type ProfileWebViewParams =
  | { mode: 'create' }
  | { mode: 'edit'; braceletId: string; editUrl: string };

export type RootStackParamList = {
  MyBracelets: undefined;
  BraceletDetail: { braceletId: string };
  ProfileWebView: ProfileWebViewParams;
  WriteTag: { braceletId: string };
  LockTag: { braceletId: string };
  ReadTag: undefined;
  Help: undefined;
};
