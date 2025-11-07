#!/bin/bash

# Yacht Email Reader Installation Script for macOS
# This script installs the application and its dependencies

set -e  # Exit on any error

# Configuration
APP_NAME="Yacht Email Reader"
INSTALL_DIR="/opt/yacht-email-reader"
BIN_NAME="yacht-email-reader"
PYTHON_MIN_VERSION="3.9"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "This script is designed for macOS only"
        exit 1
    fi
    log_info "macOS detected"
}

# Check Python version
check_python() {
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed"
        log_info "Please install Python 3.9 or later from https://python.org"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    
    if [[ $PYTHON_MAJOR -lt 3 ]] || [[ $PYTHON_MAJOR -eq 3 && $PYTHON_MINOR -lt 9 ]]; then
        log_error "Python $PYTHON_VERSION is too old. Minimum required: $PYTHON_MIN_VERSION"
        exit 1
    fi
    
    log_success "Python $PYTHON_VERSION detected"
}

# Check pip
check_pip() {
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3 is not installed"
        log_info "Installing pip3..."
        python3 -m ensurepip --upgrade
    fi
    log_success "pip3 is available"
}

# Check if running as root for system installation
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        log_warning "Not running as root. Will attempt user installation."
        INSTALL_DIR="$HOME/Applications/yacht-email-reader"
        USER_INSTALL=true
    else
        log_info "Running as root. Will install system-wide."
        USER_INSTALL=false
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing Python dependencies..."
    
    if [[ $USER_INSTALL == true ]]; then
        pip3 install --user -r requirements.txt
    else
        pip3 install -r requirements.txt
    fi
    
    log_success "Dependencies installed"
}

# Create installation directory
create_install_directory() {
    log_info "Creating installation directory: $INSTALL_DIR"
    
    if [[ $USER_INSTALL == true ]]; then
        mkdir -p "$INSTALL_DIR"
    else
        sudo mkdir -p "$INSTALL_DIR"
    fi
    
    log_success "Installation directory created"
}

# Copy application files
copy_files() {
    log_info "Copying application files..."
    
    FILES_TO_COPY=(
        "gui_app.py"
        "auth_manager.py" 
        "graph_client.py"
        "token_manager.py"
        "error_handler.py"
        "config.py"
        "requirements.txt"
        "README.md"
        "azure_setup_guide.md"
    )
    
    for file in "${FILES_TO_COPY[@]}"; do
        if [[ -f "$file" ]]; then
            if [[ $USER_INSTALL == true ]]; then
                cp "$file" "$INSTALL_DIR/"
            else
                sudo cp "$file" "$INSTALL_DIR/"
            fi
            log_info "Copied $file"
        else
            log_warning "File $file not found, skipping"
        fi
    done
    
    log_success "Application files copied"
}

# Create launcher script
create_launcher() {
    log_info "Creating launcher script..."
    
    LAUNCHER_CONTENT="#!/bin/bash
# Yacht Email Reader Launcher Script
cd \"$INSTALL_DIR\"
python3 gui_app.py \"\$@\"
"
    
    if [[ $USER_INSTALL == true ]]; then
        LAUNCHER_PATH="$HOME/.local/bin/$BIN_NAME"
        mkdir -p "$HOME/.local/bin"
        echo "$LAUNCHER_CONTENT" > "$LAUNCHER_PATH"
        chmod +x "$LAUNCHER_PATH"
        
        # Add to PATH if not already there
        if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bash_profile"
            log_info "Added $HOME/.local/bin to PATH in shell configuration files"
        fi
    else
        LAUNCHER_PATH="/usr/local/bin/$BIN_NAME"
        echo "$LAUNCHER_CONTENT" | sudo tee "$LAUNCHER_PATH" > /dev/null
        sudo chmod +x "$LAUNCHER_PATH"
    fi
    
    log_success "Launcher script created at $LAUNCHER_PATH"
}

# Create desktop application (macOS App Bundle)
create_app_bundle() {
    log_info "Creating macOS application bundle..."
    
    if [[ $USER_INSTALL == true ]]; then
        BUNDLE_PATH="$HOME/Applications/$APP_NAME.app"
    else
        BUNDLE_PATH="/Applications/$APP_NAME.app"
    fi
    
    # Create bundle structure
    if [[ $USER_INSTALL == true ]]; then
        mkdir -p "$BUNDLE_PATH/Contents/MacOS"
        mkdir -p "$BUNDLE_PATH/Contents/Resources"
    else
        sudo mkdir -p "$BUNDLE_PATH/Contents/MacOS"
        sudo mkdir -p "$BUNDLE_PATH/Contents/Resources"
    fi
    
    # Create Info.plist
    INFO_PLIST="<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">
<plist version=\"1.0\">
<dict>
    <key>CFBundleExecutable</key>
    <string>yacht-email-reader</string>
    <key>CFBundleIconFile</key>
    <string>icon</string>
    <key>CFBundleIdentifier</key>
    <string>com.yacht.email-reader</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>"
    
    # Create executable script
    EXEC_SCRIPT="#!/bin/bash
cd \"$INSTALL_DIR\"
python3 gui_app.py
"
    
    if [[ $USER_INSTALL == true ]]; then
        echo "$INFO_PLIST" > "$BUNDLE_PATH/Contents/Info.plist"
        echo "$EXEC_SCRIPT" > "$BUNDLE_PATH/Contents/MacOS/yacht-email-reader"
        chmod +x "$BUNDLE_PATH/Contents/MacOS/yacht-email-reader"
    else
        echo "$INFO_PLIST" | sudo tee "$BUNDLE_PATH/Contents/Info.plist" > /dev/null
        echo "$EXEC_SCRIPT" | sudo tee "$BUNDLE_PATH/Contents/MacOS/yacht-email-reader" > /dev/null
        sudo chmod +x "$BUNDLE_PATH/Contents/MacOS/yacht-email-reader"
    fi
    
    log_success "macOS application bundle created at $BUNDLE_PATH"
}

# Test installation
test_installation() {
    log_info "Testing installation..."
    
    # Test Python imports
    cd "$INSTALL_DIR"
    python3 -c "
import sys
sys.path.insert(0, '.')
try:
    import msal
    import keyring
    import requests
    from dateutil import parser
    print('All dependencies imported successfully')
except ImportError as e:
    print(f'Import error: {e}')
    sys.exit(1)
"
    
    if [[ $? -eq 0 ]]; then
        log_success "Installation test passed"
    else
        log_error "Installation test failed"
        exit 1
    fi
}

# Display post-installation instructions
show_instructions() {
    log_success "Installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure Azure AD app registration (see azure_setup_guide.md)"
    echo "2. Update config.py with your Azure AD details:"
    echo "   - TENANT_ID"
    echo "   - CLIENT_ID"
    echo ""
    echo "To run the application:"
    
    if [[ $USER_INSTALL == true ]]; then
        echo "   Command line: $HOME/.local/bin/$BIN_NAME"
        echo "   Application: $HOME/Applications/$APP_NAME.app"
        echo ""
        log_warning "Note: You may need to restart your terminal to use the command line launcher"
    else
        echo "   Command line: $BIN_NAME"
        echo "   Application: /Applications/$APP_NAME.app"
    fi
    
    echo ""
    echo "Documentation:"
    echo "   Installation: $INSTALL_DIR/README.md"
    echo "   Azure Setup: $INSTALL_DIR/azure_setup_guide.md"
}

# Main installation function
main() {
    log_info "Starting $APP_NAME installation..."
    
    check_macos
    check_python
    check_pip
    check_permissions
    create_install_directory
    copy_files
    install_dependencies
    create_launcher
    create_app_bundle
    test_installation
    show_instructions
    
    log_success "Installation completed!"
}

# Run main function
main "$@"