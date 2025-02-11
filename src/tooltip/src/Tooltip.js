import React, { memo, useState, useEffect, useRef } from 'react'
import cx from 'classnames'
import { css as glamorCss } from 'glamor'
import debounce from 'lodash.debounce'
import PropTypes from 'prop-types'
import { Position } from '../../constants'
import { useId } from '../../hooks'
import { Positioner } from '../../positioner'
import TooltipStateless from './TooltipStateless'

const emptyProps = {}

const Tooltip = memo(function Tooltip(props) {
  const {
    appearance = 'default',
    position = Position.BOTTOM,
    content,
    hideDelay = 120,
    showDelay = 0,
    isShown: propIsShown,
    children,
    statelessProps = emptyProps
  } = props

  const id = useId('evergreen-tooltip', props.id)
  const [isShown, setIsShown] = useState(propIsShown || false)
  const [isShownByTarget, setIsShownByTarget] = useState(false)
  const closeTimer = useRef(undefined)

  const mouseLeftTarget = () => {
    setIsShownByTarget(false)
  }

  const handleMouseLeaveTarget = debounce(mouseLeftTarget, hideDelay)

  const hide = () => {
    setIsShown(false)
    // Clean up any timeouts that may have been triggered from `showDelay`
    clearTimeout(closeTimer.current)
  }

  const handleHide = debounce(hide, hideDelay)

  // Component will unmount
  useEffect(
    () => () => {
      clearTimeout(closeTimer.current)
    },
    []
  )

  const show = () => {
    if (isShown) return

    if (!showDelay) {
      setIsShown(true)
      return
    }

    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setIsShown(true)
    }, showDelay)
  }

  const renderTarget = ({ getRef }) => {
    const tooltipTargetProps = {
      onMouseEnter: show,
      onMouseLeave: handleHide,
      'aria-describedby': id
    }

    /**
     * Tooltips can be used within a Popover (not the other way around)
     * When a Tooltip is used within a Popover, the Popover passes
     * its props to the Tooltip in a `popoverProps` object.
     */
    // eslint-disable-next-line react/prop-types
    if (props.popoverProps) {
      const {
        // eslint-disable-next-line react/prop-types
        getTargetRef,
        // eslint-disable-next-line react/prop-types
        isShown,
        ...popoverTargetProps
        // eslint-disable-next-line react/prop-types
      } = props.popoverProps

      return React.cloneElement(children, {
        // Add the Popover props to the target.
        ...popoverTargetProps,
        // Add the Tooltip props to the target.
        ...tooltipTargetProps,

        ref: ref => {
          // Get the ref for the Tooltip.
          getRef(ref)
          // Pass the ref to the Popover.
          getTargetRef(ref)
        }
      })
    }

    /**
     * With normal usage only the props for a Tooltip are passed to the target.
     */
    return React.cloneElement(children, {
      ...tooltipTargetProps,
      ref: ref => {
        getRef(ref)
      }
    })
  }

  // eslint-disable-next-line react/prop-types
  const isPopoverShown = () => props.popoverProps && props.popoverProps.isShown

  const handleMouseEnterTarget = () => {
    setIsShownByTarget(true)
  }

  let shown = (propIsShown || isShown || isShownByTarget) && !isPopoverShown()

  // Tooltip was explicitly set to not be shown
  if (propIsShown === false) {
    shown = false
  }

  return (
    <Positioner target={renderTarget} isShown={shown} position={position} animationDuration={160}>
      {({ css, getRef, state, style }) => (
        <TooltipStateless
          id={id}
          appearance={appearance}
          ref={getRef}
          data-state={state}
          style={style}
          onMouseEnter={handleMouseEnterTarget}
          onMouseLeave={handleMouseLeaveTarget}
          {...statelessProps}
          className={cx(statelessProps.className, css ? glamorCss(css).toString() : undefined)}
        >
          {content}
        </TooltipStateless>
      )}
    </Positioner>
  )
})

Tooltip.propTypes = {
  /**
   * The appearance of the tooltip.
   */
  appearance: PropTypes.oneOf(['default', 'card']),

  /**
   * The id of the tooltip.
   */
  id: PropTypes.string,

  /**
   * The position the Popover is on.
   */
  position: PropTypes.oneOf([
    Position.TOP,
    Position.TOP_LEFT,
    Position.TOP_RIGHT,
    Position.BOTTOM,
    Position.BOTTOM_LEFT,
    Position.BOTTOM_RIGHT,
    Position.LEFT,
    Position.RIGHT
  ]),

  /**
   * The content of the Popover.
   */
  content: PropTypes.node,

  /**
   * Time in ms before hiding the Tooltip.
   */
  hideDelay: PropTypes.number,

  /**
   * Time in ms before showing the Tooltip.
   */
  showDelay: PropTypes.number,

  /**
   * Controls whether the Tooltip is shown or not.
   * - When `true`, the component is always shown, regardless of the whether the target is hovered.
   * - When `false`, the component is never shown, regardless of the whether the target is hovered.
   * - When `undefined`, the component is uncontrolled and the isShown state is handled internally
   * (i.e. the Tooltip is shown when the target is hovered)
   */
  isShown: PropTypes.bool,

  /**
   * The target button of the Tooltip.
   */
  children: PropTypes.node,

  /**
   * Properties passed through to the Tooltip.
   */
  statelessProps: PropTypes.object
}

export default Tooltip
