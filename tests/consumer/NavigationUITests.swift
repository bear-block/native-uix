import XCTest

final class NavigationUITests: XCTestCase {
  func testLinkedHistorySurvivesRepeatedRemountAndNativeBack() {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "org.reactjs.native.example.NUXConsumer")
    app.launch()
    defer { app.terminate() }

    let resolve = app.buttons["Resolve detail link"]
    XCTAssertTrue(resolve.waitForExistence(timeout: 15))
    app.buttons["Pressed 0"].tap()
    XCTAssertTrue(app.buttons["Pressed 1"].waitForExistence(timeout: 5))
    resolve.tap()
    XCTAssertTrue(app.navigationBars["Detail"].waitForExistence(timeout: 5))

    for _ in 0..<3 {
      let remount = app.buttons["Remount restored detail"]
      XCTAssertTrue(remount.waitForExistence(timeout: 5))
      remount.tap()
      let bar = app.navigationBars["Detail"]
      XCTAssertTrue(bar.waitForExistence(timeout: 5))
      XCTAssertTrue(bar.buttons.firstMatch.waitForExistence(timeout: 5))
      XCTAssertTrue(bar.buttons.firstMatch.isHittable)
    }

    app.navigationBars["Detail"].buttons.firstMatch.tap()
    XCTAssertTrue(resolve.waitForExistence(timeout: 5))
    XCTAssertTrue(app.navigationBars["Consumer"].exists)
    XCTAssertFalse(app.buttons["Remount restored detail"].exists)

    app.buttons["Open list"].tap()
    XCTAssertTrue(app.staticTexts["Item 1"].waitForExistence(timeout: 5))
    let back = app.navigationBars.buttons.firstMatch
    XCTAssertTrue(back.waitForExistence(timeout: 5))
    back.tap()
    XCTAssertTrue(resolve.waitForExistence(timeout: 5))
    XCTAssertTrue(app.navigationBars["Consumer"].exists)
  }
}
