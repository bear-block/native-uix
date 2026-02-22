import type {HostComponent, ViewProps} from 'react-native';
import {codegenNativeComponent} from 'react-native';

// A page of NativeUIXTabContent; the container decides whether it is shown.
export interface NativeUIXTabPageProps extends ViewProps {
  pageId: string;
}

export default codegenNativeComponent<NativeUIXTabPageProps>(
  'NativeUIXTabPage',
) as HostComponent<NativeUIXTabPageProps>;
