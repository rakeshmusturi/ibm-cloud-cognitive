/**
 * Copyright IBM Corp. 2021, 2022
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {
  forwardRef,
  useState,
  useRef,
  createContext,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Form } from '@carbon/react';
import wrapFocus from '../../global/js/utils/wrapFocus';
import { TearsheetShell } from '../Tearsheet/TearsheetShell';
import { CreateInfluencer } from '../CreateInfluencer';
import { pkg } from '../../settings';
import {
  usePreviousValue,
  useValidCreateStepCount,
  useResetCreateComponent,
  useCreateComponentFocus,
  useCreateComponentStepChange,
} from '../../global/js/hooks';
import { getDevtoolsProps } from '../../global/js/utils/devtools';
import { lastIndexInArray } from '../../global/js/utils/lastIndexInArray';
import { getNumberOfHiddenSteps } from '../../global/js/utils/getNumberOfHiddenSteps';

const componentName = 'CreateTearsheet';
const blockClass = `${pkg.prefix}--tearsheet-create`;

// This is a general context for the steps container
// containing information about the state of the container
// and providing some callback methods for steps to use
export const StepsContext = createContext(null);

// This is a context supplied separately to each step in the container
// to let it know what number it is in the sequence of steps
export const StepNumberContext = createContext(-1);

// Default values for props
const defaults = {
  verticalPosition: 'normal',
  influencerWidth: 'narrow',
};

export let CreateTearsheet = forwardRef(
  (
    {
      // The component props, in alphabetical order (for consistency).

      backButtonText,
      cancelButtonText,
      children,
      className,
      description,
      influencerWidth = defaults.influencerWidth,
      initialStep,
      label,
      nextButtonText,
      onClose,
      onRequestSubmit,
      open,
      firstFocusElement,
      submitButtonText,
      title,
      verticalPosition = defaults.verticalPosition,

      // Collect any other property values passed in.
      ...rest
    },
    ref
  ) => {
    const [createTearsheetActions, setCreateTearsheetActions] = useState([]);
    const [shouldViewAll, setShouldViewAll] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [loadingPrevious, setLoadingPrevious] = useState(false);
    const [onPrevious, setOnPrevious] = useState();
    const [onNext, setOnNext] = useState();
    const [onMount, setOnMount] = useState();
    const [stepData, setStepData] = useState([]);
    const [firstIncludedStep, setFirstIncludedStep] = useState(1);
    const [lastIncludedStep, setLastIncludedStep] = useState(null);

    const previousState = usePreviousValue({ currentStep, open });
    const contentRef = useRef();

    useEffect(() => {
      const firstItem =
        stepData.findIndex((item) => item?.shouldIncludeStep) + 1;
      const lastItem = lastIndexInArray(stepData, 'shouldIncludeStep', true);
      if (firstItem !== firstIncludedStep) {
        setFirstIncludedStep(firstItem);
      }
      if (lastItem !== lastIncludedStep) {
        setLastIncludedStep(lastItem);
      }
      if (open && initialStep) {
        const numberOfHiddenSteps = getNumberOfHiddenSteps(
          stepData,
          initialStep
        );
        setCurrentStep(Number(initialStep + numberOfHiddenSteps));
      }
    }, [stepData, firstIncludedStep, lastIncludedStep, initialStep, open]);

    useCreateComponentFocus({
      previousState,
      currentStep,
      blockClass,
      onMount,
      firstFocusElement,
    });
    useValidCreateStepCount(stepData.length, componentName);
    useResetCreateComponent({
      firstIncludedStep,
      previousState,
      open,
      setCurrentStep,
      stepData,
      initialStep,
      totalSteps: stepData?.length,
      componentName,
    });
    useCreateComponentStepChange({
      firstIncludedStep,
      lastIncludedStep,
      stepData,
      onPrevious,
      onNext,
      isSubmitDisabled: isDisabled,
      setCurrentStep,
      setIsSubmitting,
      setShouldViewAll,
      setLoadingPrevious,
      loadingPrevious,
      onClose,
      onRequestSubmit,
      componentName,
      currentStep,
      shouldViewAll,
      backButtonText,
      cancelButtonText,
      submitButtonText,
      nextButtonText,
      isSubmitting,
      componentBlockClass: blockClass,
      setCreateComponentActions: setCreateTearsheetActions,
    });

    // adds focus trap functionality
    /* istanbul ignore next */
    const handleBlur = ({
      target: oldActiveNode,
      relatedTarget: currentActiveNode,
    }) => {
      const visibleStepInnerContent = document.querySelector(
        `.${pkg.prefix}--tearsheet__body`
      );
      if (open && visibleStepInnerContent) {
        wrapFocus({
          bodyNode: visibleStepInnerContent,
          currentActiveNode,
          oldActiveNode,
        });
      }
    };

    return (
      <TearsheetShell
        {...rest}
        {...getDevtoolsProps(componentName)}
        actions={createTearsheetActions}
        className={cx(blockClass, className)}
        description={description}
        hasCloseIcon={false}
        influencer={
          <CreateInfluencer currentStep={currentStep} stepData={stepData} />
        }
        influencerPosition="left"
        influencerWidth={influencerWidth}
        label={label}
        onClose={onClose}
        open={open}
        size="wide"
        title={title}
        verticalPosition={verticalPosition}
        ref={ref}
      >
        <div
          className={`${blockClass}__content`}
          onBlur={handleBlur}
          ref={contentRef}
        >
          <Form aria-label={title}>
            <StepsContext.Provider
              value={{
                currentStep,
                setIsDisabled,
                setOnPrevious: (fn) => setOnPrevious(() => fn),
                setOnNext: (fn) => setOnNext(() => fn),
                setOnMount: (fn) => setOnMount(() => fn),
                setStepData,
                stepData,
              }}
            >
              {React.Children.map(children, (child, index) => (
                <StepNumberContext.Provider value={index + 1}>
                  {child}
                </StepNumberContext.Provider>
              ))}
            </StepsContext.Provider>
          </Form>
        </div>
      </TearsheetShell>
    );
  }
);

// Return a placeholder if not released and not enabled by feature flag
CreateTearsheet = pkg.checkComponentEnabled(CreateTearsheet, componentName);

// The display name of the component, used by React. Note that displayName
// is used in preference to relying on function.name.
CreateTearsheet.displayName = componentName;

// Note that the descriptions here should be kept in sync with those for the
// corresponding props for TearsheetNarrow and TearsheetShell components.
CreateTearsheet.propTypes = {
  /**
   * The back button text
   */
  backButtonText: PropTypes.string.isRequired,

  /**
   * The cancel button text
   */
  cancelButtonText: PropTypes.string.isRequired,

  /**
   * The main content of the tearsheet
   */
  children: PropTypes.node,

  /**
   * An optional class or classes to be added to the outermost element.
   */
  className: PropTypes.string,

  /**
   * A description of the flow, displayed in the header area of the tearsheet.
   */
  description: PropTypes.node,

  /**
   * Specifies elements to focus on first on render.
   */
  firstFocusElement: PropTypes.string,

  /**
   * Used to set the size of the influencer
   */
  influencerWidth: PropTypes.oneOf(['narrow', 'wide']),

  /**
   * This can be used to open the component to a step other than the first step.
   * For example, a create flow was previously in progress, data was saved, and
   * is now being completed.
   */
  initialStep: PropTypes.number,

  /**
   * A label for the tearsheet, displayed in the header area of the tearsheet
   * to maintain context for the tearsheet (e.g. as the title changes from page
   * to page of a multi-page task).
   */
  label: PropTypes.node,

  /**
   * The next button text
   */
  nextButtonText: PropTypes.string.isRequired,

  /**
   * An optional handler that is called when the user closes the tearsheet (by
   * clicking the close button, if enabled, or clicking outside, if enabled).
   * Returning `false` here prevents the modal from closing.
   */
  onClose: PropTypes.func,

  /**
   * Specify a handler for submitting the multi step tearsheet (final step).
   * This function can _optionally_ return a promise that is either resolved or rejected and the CreateTearsheet will handle the submitting state of the create button.
   */
  onRequestSubmit: PropTypes.func.isRequired,

  /**
   * Specifies whether the tearsheet is currently open.
   */
  open: PropTypes.bool,

  /**
   * The submit button text
   */
  submitButtonText: PropTypes.string.isRequired,

  /**
   * The main title of the tearsheet, displayed in the header area.
   */
  title: PropTypes.node,

  /**
   * The position of the top of tearsheet in the viewport. The 'normal'
   * position (the default) is a short distance down from the top of the
   * viewport, leaving room at the top for a global header bar to show through
   * from below. The 'lower' position provides a little extra room at the top
   * to allow an action bar navigation or breadcrumbs to also show through.
   */
  verticalPosition: PropTypes.oneOf(['normal', 'lower']),
};
